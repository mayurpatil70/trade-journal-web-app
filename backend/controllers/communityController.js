// backend/controllers/communityController.js
import crypto from "crypto";
import { supabase } from "../config/supabase.js";
import { getUserSummaries, getServerRole, forgetConversation } from "../services/loungeService.js";
import { isOnline } from "../socket/index.js";

const SERVER_COLS = "id, name, description, icon_url, is_public, owner_id, invite_code, member_count, created_at";
const CHANNEL_COLS = "id, title, description, server_id, is_group, is_public, created_at";
const MAX_CHANNELS = 50;

const fail = (res, err, status = 500) => {
  console.error("[Community]", err?.message || err);
  return res.status(status).json({ error: status === 500 ? "Something went wrong." : err });
};

const newInviteCode = () => crypto.randomBytes(6).toString("base64url");
const canManage = (role) => role === "owner" || role === "admin";
const cleanIcon = (url) => (/^https:\/\/res\.cloudinary\.com\//.test(String(url || "")) ? url : null);
const cleanChannelName = (name) =>
  String(name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 30);

function toServerDto(row, role) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    iconUrl: row.icon_url,
    isPublic: row.is_public,
    ownerId: row.owner_id,
    memberCount: row.member_count || 0,
    role: role || null,
    inviteCode: role ? row.invite_code : undefined,
    createdAt: row.created_at,
  };
}

async function getServerRow(id) {
  const { data, error } = await supabase.from("community_servers").select(SERVER_COLS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

async function listChannels(serverId) {
  const { data, error } = await supabase
    .from("conversations")
    .select(CHANNEL_COLS)
    .eq("server_id", serverId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function createChannel(serverId, userId, name, description = "") {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ is_group: true, is_public: false, server_id: serverId, title: name, description, created_by: userId })
    .select(CHANNEL_COLS)
    .single();
  if (error) throw error;
  return data;
}

async function addMember(serverId, userId, role = "member") {
  const { error } = await supabase
    .from("community_server_members")
    .upsert({ server_id: serverId, user_id: userId, role }, { onConflict: "server_id,user_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function listMyServers(req, res) {
  try {
    const { data: memberships, error } = await supabase
      .from("community_server_members")
      .select("server_id, role, joined_at")
      .eq("user_id", req.userId)
      .order("joined_at", { ascending: true });
    if (error) throw error;
    const ids = (memberships || []).map((m) => m.server_id);
    if (!ids.length) return res.json([]);
    const { data: rows } = await supabase.from("community_servers").select(SERVER_COLS).in("id", ids);
    const byId = Object.fromEntries((rows || []).map((r) => [r.id, r]));
    res.json(memberships.filter((m) => byId[m.server_id]).map((m) => toServerDto(byId[m.server_id], m.role)));
  } catch (err) {
    fail(res, err);
  }
}

export async function discoverServers(req, res) {
  try {
    const q = String(req.query.q || "").trim().slice(0, 40).replace(/[%_,()]/g, "");
    let query = supabase.from("community_servers").select(SERVER_COLS).eq("is_public", true).order("member_count", { ascending: false }).limit(40);
    if (q) query = query.ilike("name", `%${q}%`);
    const [{ data, error }, { data: mine }] = await Promise.all([
      query,
      supabase.from("community_server_members").select("server_id, role").eq("user_id", req.userId),
    ]);
    if (error) throw error;
    const roles = Object.fromEntries((mine || []).map((m) => [m.server_id, m.role]));
    res.json((data || []).map((s) => toServerDto(s, roles[s.id])));
  } catch (err) {
    fail(res, err);
  }
}

export async function createServer(req, res) {
  try {
    const name = String(req.body?.name || "").trim().slice(0, 60);
    if (name.length < 2) return fail(res, "Give your server a name.", 400);
    const { data: server, error } = await supabase
      .from("community_servers")
      .insert({
        name,
        description: String(req.body?.description || "").trim().slice(0, 300),
        icon_url: cleanIcon(req.body?.iconUrl),
        is_public: req.body?.isPublic !== false,
        owner_id: req.userId,
        invite_code: newInviteCode(),
      })
      .select(SERVER_COLS)
      .single();
    if (error) throw error;
    await addMember(server.id, req.userId, "owner");
    const channel = await createChannel(server.id, req.userId, "general", "Say hi and start the conversation");
    res.status(201).json({ server: toServerDto({ ...server, member_count: 1 }, "owner"), channels: [channel] });
  } catch (err) {
    fail(res, err);
  }
}

export async function getServer(req, res) {
  try {
    const server = await getServerRow(req.params.id);
    if (!server) return fail(res, "Server not found.", 404);
    const role = await getServerRole(server.id, req.userId);
    if (!role && !server.is_public) return fail(res, "This server is private. Ask a member for an invite link.", 403);
    res.json({ server: toServerDto(server, role), channels: await listChannels(server.id) });
  } catch (err) {
    fail(res, err);
  }
}

export async function updateServer(req, res) {
  try {
    const role = await getServerRole(req.params.id, req.userId);
    if (!canManage(role)) return fail(res, "Only the owner or an admin can edit this server.", 403);
    const body = req.body || {};
    const patch = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) {
      const name = String(body.name).trim().slice(0, 60);
      if (name.length < 2) return fail(res, "Give your server a name.", 400);
      patch.name = name;
    }
    if (body.description !== undefined) patch.description = String(body.description).trim().slice(0, 300);
    if (body.iconUrl !== undefined) patch.icon_url = cleanIcon(body.iconUrl);
    if (body.isPublic !== undefined) patch.is_public = Boolean(body.isPublic);
    const { data, error } = await supabase.from("community_servers").update(patch).eq("id", req.params.id).select(SERVER_COLS).single();
    if (error) throw error;
    res.json(toServerDto(data, role));
  } catch (err) {
    fail(res, err);
  }
}

export async function deleteServer(req, res) {
  try {
    const role = await getServerRole(req.params.id, req.userId);
    if (role !== "owner") return fail(res, "Only the owner can delete this server.", 403);
    const channels = await listChannels(req.params.id);
    const { error } = await supabase.from("community_servers").delete().eq("id", req.params.id);
    if (error) throw error;
    channels.forEach((c) => forgetConversation(c.id));
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
}

export async function joinServer(req, res) {
  try {
    const server = await getServerRow(req.params.id);
    if (!server) return fail(res, "Server not found.", 404);
    if (!server.is_public) return fail(res, "This server is private. Ask a member for an invite link.", 403);
    await addMember(server.id, req.userId);
    const fresh = await getServerRow(server.id);
    res.json({ server: toServerDto(fresh, (await getServerRole(server.id, req.userId)) || "member"), channels: await listChannels(server.id) });
  } catch (err) {
    fail(res, err);
  }
}

export async function leaveServer(req, res) {
  try {
    const role = await getServerRole(req.params.id, req.userId);
    if (role === "owner") return fail(res, "Owners can't leave their own server. Delete it instead.", 400);
    const { error } = await supabase.from("community_server_members").delete().eq("server_id", req.params.id).eq("user_id", req.userId);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
}

export async function addChannel(req, res) {
  try {
    const role = await getServerRole(req.params.id, req.userId);
    if (!canManage(role)) return fail(res, "Only the owner or an admin can add channels.", 403);
    const name = cleanChannelName(req.body?.name);
    if (name.length < 2) return fail(res, "Channel names need at least 2 letters or numbers.", 400);
    const existing = await listChannels(req.params.id);
    if (existing.length >= MAX_CHANNELS) return fail(res, `A server can have up to ${MAX_CHANNELS} channels.`, 400);
    if (existing.some((c) => c.title === name)) return fail(res, "A channel with that name already exists.", 409);
    res.status(201).json(await createChannel(req.params.id, req.userId, name, String(req.body?.description || "").trim().slice(0, 200)));
  } catch (err) {
    fail(res, err);
  }
}

export async function removeChannel(req, res) {
  try {
    const role = await getServerRole(req.params.id, req.userId);
    if (!canManage(role)) return fail(res, "Only the owner or an admin can delete channels.", 403);
    const channels = await listChannels(req.params.id);
    if (channels.length <= 1) return fail(res, "A server needs at least one channel.", 400);
    const { error } = await supabase.from("conversations").delete().eq("id", req.params.channelId).eq("server_id", req.params.id);
    if (error) throw error;
    forgetConversation(req.params.channelId);
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
}

export async function listMembers(req, res) {
  try {
    const server = await getServerRow(req.params.id);
    if (!server) return fail(res, "Server not found.", 404);
    const role = await getServerRole(server.id, req.userId);
    if (!role && !server.is_public) return fail(res, "Not allowed.", 403);
    const { data, error } = await supabase
      .from("community_server_members")
      .select("user_id, role, joined_at")
      .eq("server_id", server.id)
      .order("joined_at", { ascending: true })
      .limit(500);
    if (error) throw error;
    const summaries = await getUserSummaries((data || []).map((m) => m.user_id));
    res.json((data || []).map((m) => ({ ...summaries[m.user_id], role: m.role, isOnline: isOnline(m.user_id) })));
  } catch (err) {
    fail(res, err);
  }
}

export async function resetInvite(req, res) {
  try {
    const role = await getServerRole(req.params.id, req.userId);
    if (!canManage(role)) return fail(res, "Only the owner or an admin can reset the invite link.", 403);
    const { data, error } = await supabase
      .from("community_servers")
      .update({ invite_code: newInviteCode(), updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("invite_code")
      .single();
    if (error) throw error;
    res.json({ inviteCode: data.invite_code });
  } catch (err) {
    fail(res, err);
  }
}

async function getServerByInvite(code) {
  const { data, error } = await supabase.from("community_servers").select(SERVER_COLS).eq("invite_code", String(code).slice(0, 16)).maybeSingle();
  if (error) throw error;
  return data;
}

export async function previewInvite(req, res) {
  try {
    const server = await getServerByInvite(req.params.code);
    if (!server) return fail(res, "This invite link is invalid or has been reset.", 404);
    const [role, owner] = await Promise.all([getServerRole(server.id, req.userId), getUserSummaries([server.owner_id])]);
    res.json({ ...toServerDto(server, role), inviteCode: undefined, owner: owner[server.owner_id], isMember: Boolean(role) });
  } catch (err) {
    fail(res, err);
  }
}

export async function acceptInvite(req, res) {
  try {
    const server = await getServerByInvite(req.params.code);
    if (!server) return fail(res, "This invite link is invalid or has been reset.", 404);
    await addMember(server.id, req.userId);
    const fresh = await getServerRow(server.id);
    res.json({ server: toServerDto(fresh, (await getServerRole(server.id, req.userId)) || "member"), channels: await listChannels(server.id) });
  } catch (err) {
    fail(res, err);
  }
}
