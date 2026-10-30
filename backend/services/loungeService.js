// backend/services/loungeService.js
import { supabase } from "../config/supabase.js";

const conversationCache = new Map();

async function getConversation(conversationId) {
  if (conversationCache.has(conversationId)) return conversationCache.get(conversationId);
  const { data, error } = await supabase
    .from("conversations")
    .select("id, is_group, is_public, slug, title")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw error;
  if (data) conversationCache.set(conversationId, data);
  return data;
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

export async function getUserSummaries(userIds) {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return {};
  const [{ data: users }, { data: profiles }] = await Promise.all([
    supabase.from("users").select("id, email, display_name, avatar_url").in("id", ids),
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
      handle: fallback.toLowerCase().replace(/[^a-z0-9_]/g, ""),
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

export function toMessageDto(row, sender) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    sender,
    content: row.content,
    mediaUrl: row.media_url,
    isTradeShare: row.is_trade_share,
    sharedTrade: row.shared_trade_data,
    createdAt: row.created_at,
  };
}

export async function saveMessage({ conversationId, senderId, content, mediaUrl, sharedTrade }) {
  const { data, error } = await supabase
    .from("lounge_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content || "",
      media_url: mediaUrl || null,
      is_trade_share: Boolean(sharedTrade),
      shared_trade_data: sharedTrade || null,
    })
    .select()
    .single();
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

  const [summaries, participantIds] = await Promise.all([
    getUserSummaries([senderId]),
    isPublicChannel(conversationId).then((pub) => (pub ? [] : getParticipantIds(conversationId))),
  ]);
  return { ...toMessageDto(data, summaries[senderId]), participantIds };
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
