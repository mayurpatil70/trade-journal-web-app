// backend/services/loungeService.js
import { supabase } from "../config/supabase.js";

const conversationCache = new Map();

async function getConversation(conversationId) {
  if (conversationCache.has(conversationId)) return conversationCache.get(conversationId);
  const query = (cols) => supabase.from("conversations").select(cols).eq("id", conversationId).maybeSingle();
  // server_id comes from migration 014; fall back if it has not run yet.
  let { data, error } = await query("id, is_group, is_public, slug, title, server_id");
  if (error) ({ data, error } = await query("id, is_group, is_public, slug, title"));
  if (error) throw error;
  if (data) conversationCache.set(conversationId, data);
  return data;
}

export function forgetConversation(conversationId) {
  conversationCache.delete(conversationId);
}

export async function getServerRole(serverId, userId) {
  const { data } = await supabase
    .from("community_server_members")
    .select("role")
    .eq("server_id", serverId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role || null;
}

export async function isPublicChannel(conversationId) {
  return Boolean((await getConversation(conversationId))?.is_public);
}

export async function getParticipantIds(conversationId) {
  const { data, error } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId);
  if (error) throw error;
  return (data || []).map((p) => p.user_id);
}

export async function canAccessConversation(conversationId, userId) {
  if (!conversationId) return false;
  const conversation = await getConversation(conversationId);
  if (!conversation) return false;
  if (conversation.is_public) return true;
  if (conversation.server_id) return Boolean(await getServerRole(conversation.server_id, userId));
  const { data } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function getOrCreateDirectConversation(userA, userB) {
  const { data: mine } = await supabase
    .from("conversation_participants")
    .select("conversation_id, conversations!inner(is_group)")
    .eq("user_id", userA)
    .eq("conversations.is_group", false);
  const myIds = (mine || []).map((r) => r.conversation_id);

  if (myIds.length) {
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userB)
      .in("conversation_id", myIds)
      .limit(1);
    if (shared?.length) return { id: shared[0].conversation_id, created: false };
  }

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({ is_group: false, created_by: userA })
    .select("id")
    .single();
  if (error) throw error;

  const { error: pErr } = await supabase.from("conversation_participants").insert([
    { conversation_id: conversation.id, user_id: userA },
    { conversation_id: conversation.id, user_id: userB, last_read_at: new Date(0).toISOString() },
  ]);
  if (pErr) throw pErr;
  return { id: conversation.id, created: true };
}

// users.username comes from migration 012; fall back to the older columns if it has not run yet.
async function selectUsers(ids) {
  const { data, error } = await supabase.from("users").select("id, email, display_name, avatar_url, username").in("id", ids);
  if (!error) return data;
  const { data: legacy } = await supabase.from("users").select("id, email, display_name, avatar_url").in("id", ids);
  return legacy;
}

export async function getUserSummaries(userIds) {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return {};
  const [users, { data: profiles }] = await Promise.all([
    selectUsers(ids),
    supabase
      .from("trader_profiles")
      .select("user_id, handle, primary_strategy, prop_badges, is_verified, is_public")
      .in("user_id", ids),
  ]);

  const byId = {};
  for (const id of ids) byId[id] = { id };
  for (const u of users || []) {
    const fallback = (u.email || "trader").split("@")[0];
    byId[u.id] = {
      ...byId[u.id],
      displayName: u.display_name || fallback,
      avatarUrl: u.avatar_url || null,
      handle: u.username || fallback.toLowerCase().replace(/[^a-z0-9_]/g, ""),
    };
  }
  for (const p of profiles || []) {
    byId[p.user_id] = {
      ...byId[p.user_id],
      ...(p.handle && { handle: p.handle }),
      primaryStrategy: p.primary_strategy,
      propBadges: p.prop_badges || [],
      isVerified: Boolean(p.is_verified),
      isPublic: Boolean(p.is_public),
    };
  }
  for (const id of ids) {
    byId[id].displayName ||= "Trader";
    byId[id].handle ||= `trader${id.slice(0, 6)}`;
  }
  return byId;
}

export function getConversationMeta(conversationId) {
  return getConversation(conversationId);
}

export function toMessageDto(row, sender, replyTo = null) {
  const deleted = Boolean(row.deleted_at);
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    sender,
    content: deleted ? "" : row.content,
    mediaUrl: deleted ? null : row.media_url,
    isTradeShare: deleted ? false : row.is_trade_share,
    sharedTrade: deleted ? null : row.shared_trade_data,
    createdAt: row.created_at,
    editedAt: row.edited_at || null,
    deletedAt: row.deleted_at || null,
    isForwarded: Boolean(row.is_forwarded),
    mentions: deleted ? [] : row.mentions || [],
    replyTo,
  };
}

// Quoted previews for replies, keyed by the replied-to message id.
export async function getReplyPreviews(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const { data } = await supabase.from("lounge_messages").select("*").in("id", unique);
  const senders = await getUserSummaries((data || []).map((m) => m.sender_id));
  return Object.fromEntries(
    (data || []).map((m) => [
      m.id,
      {
        id: m.id,
        senderId: m.sender_id,
        senderName: senders[m.sender_id]?.displayName || "Trader",
        content: m.deleted_at ? "" : String(m.content || "").slice(0, 140),
        hasMedia: !m.deleted_at && Boolean(m.media_url || m.is_trade_share),
        deleted: Boolean(m.deleted_at),
      },
    ]),
  );
}

const MENTION_RE = /(?:^|[^a-zA-Z0-9_])@([a-zA-Z0-9_]{2,30})/g;

// Maps @handles in the text to user ids (lounge handle first, then account username).
export async function resolveMentions(content) {
  const handles = [...new Set([...String(content || "").matchAll(MENTION_RE)].map((m) => m[1].toLowerCase()))].slice(0, 20);
  if (!handles.length) return [];
  const [{ data: byHandle }, byUsername] = await Promise.all([
    supabase.from("trader_profiles").select("user_id, handle").in("handle", handles),
    supabase.from("users").select("id, username").in("username", handles),
  ]);
  const found = new Map();
  for (const u of byUsername.data || []) if (u.username) found.set(u.username.toLowerCase(), String(u.id));
  for (const p of byHandle || []) if (p.handle) found.set(p.handle.toLowerCase(), String(p.user_id));
  return handles.filter((h) => found.has(h)).map((h) => ({ handle: h, id: found.get(h) }));
}

export async function saveMessage({ conversationId, senderId, content, mediaUrl, sharedTrade, replyToId, forwarded, mentions = [] }) {
  const row = {
    conversation_id: conversationId,
    sender_id: senderId,
    content: content || "",
    media_url: mediaUrl || null,
    is_trade_share: Boolean(sharedTrade),
    shared_trade_data: sharedTrade || null,
  };
  // Columns from migration 015; only sent when used so chat keeps working before it runs.
  const extras = {};
  if (replyToId) extras.reply_to_id = replyToId;
  if (forwarded) extras.is_forwarded = true;
  if (mentions.length) extras.mentions = mentions;
  let { data, error } = await supabase.from("lounge_messages").insert({ ...row, ...extras }).select().single();
  if (error && Object.keys(extras).length) {
    ({ data, error } = await supabase.from("lounge_messages").insert(row).select().single());
  }
  if (error) throw error;

  const now = new Date().toISOString();
  await Promise.all([
    supabase.from("conversations").update({ updated_at: now }).eq("id", conversationId),
    supabase
      .from("conversation_participants")
      .update({ last_read_at: now })
      .eq("conversation_id", conversationId)
      .eq("user_id", senderId),
  ]);

  const [summaries, participantIds, replies] = await Promise.all([
    getUserSummaries([senderId]),
    isPublicChannel(conversationId).then((pub) => (pub ? [] : getParticipantIds(conversationId))),
    getReplyPreviews([data.reply_to_id]),
  ]);
  return { ...toMessageDto(data, summaries[senderId], replies[data.reply_to_id] || null), participantIds };
}

export async function getMessageRow(messageId) {
  const { data, error } = await supabase.from("lounge_messages").select("*").eq("id", messageId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateMessageRow(messageId, patch) {
  const { data, error } = await supabase.from("lounge_messages").update(patch).eq("id", messageId).select().single();
  if (error) throw error;
  const [summaries, replies] = await Promise.all([getUserSummaries([data.sender_id]), getReplyPreviews([data.reply_to_id])]);
  return toMessageDto(data, summaries[data.sender_id], replies[data.reply_to_id] || null);
}

export async function markConversationRead(conversationId, userId) {
  const timestamp = new Date().toISOString();
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: timestamp })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
  return timestamp;
}
