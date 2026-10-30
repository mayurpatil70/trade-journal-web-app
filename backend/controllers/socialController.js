// backend/controllers/socialController.js
import { supabase } from "../config/supabase.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import {
  getUserSummaries,
  getOrCreateDirectConversation,
  canAccessConversation,
  toMessageDto,
} from "../services/loungeService.js";
import { isOnline, getOnlineUserIds, emitToUser, broadcastDeal } from "../socket/index.js";

const FEED_PAGE = 20;
const MESSAGES_PAGE = 40;
const ASSET_RE = /\$([A-Za-z]{3,10})/;

const fail = (res, err, status = 500) => {
  console.error("[Social]", err?.message || err);
  return res.status(status).json({ error: status === 500 ? "Something went wrong." : err });
};

async function getFollowCounts(userId) {
  const [followers, following] = await Promise.all([
    supabase.from("trader_follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("trader_follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return { followers: followers.count || 0, following: following.count || 0 };
}

async function getFollowingIds(userId) {
  const { data } = await supabase.from("trader_follows").select("following_id").eq("follower_id", userId);
  return (data || []).map((r) => r.following_id);
}

async function getFollowerIds(userId) {
  const { data } = await supabase.from("trader_follows").select("follower_id").eq("following_id", userId);
  return (data || []).map((r) => r.follower_id);
}

async function hydratePosts(rows, viewerId) {
  if (!rows?.length) return [];
  const ids = rows.map((p) => p.id);
  const [authors, likes, reposts, bookmarks] = await Promise.all([
    getUserSummaries(rows.map((p) => p.user_id)),
    supabase.from("trader_post_likes").select("post_id").eq("user_id", viewerId).in("post_id", ids),
    supabase.from("trader_post_reposts").select("post_id").eq("user_id", viewerId).in("post_id", ids),
    supabase.from("trader_post_bookmarks").select("post_id").eq("user_id", viewerId).in("post_id", ids),
  ]);
  const toSet = (r) => new Set((r.data || []).map((x) => x.post_id));
  const [liked, reposted, bookmarked] = [toSet(likes), toSet(reposts), toSet(bookmarks)];

  return rows.map((p) => ({
    id: p.id,
    author: authors[p.user_id],
    content: p.content,
    mediaUrls: p.media_urls || [],
    tradeId: p.trade_id,
    assetTag: p.asset_tag,
    sentiment: p.sentiment,
    tradeResult: p.trade_result,
    isSetup: p.is_setup,
    parentId: p.parent_id,
    likesCount: p.likes_count,
    repostsCount: p.reposts_count,
    repliesCount: p.replies_count,
    createdAt: p.created_at,
    liked: liked.has(p.id),
    reposted: reposted.has(p.id),
    bookmarked: bookmarked.has(p.id),
  }));
}

// ── Profiles ────────────────────────────────────────────────────────────────

export async function getMyProfile(req, res) {
  try {
    const [summaries, counts] = await Promise.all([getUserSummaries([req.userId]), getFollowCounts(req.userId)]);
    const { data: profile } = await supabase.from("trader_profiles").select("*").eq("user_id", req.userId).maybeSingle();
    res.json({ ...summaries[req.userId], bio: profile?.bio || "", isPublic: Boolean(profile?.is_public), ...counts });
  } catch (err) {
    fail(res, err);
  }
}

export async function updateMyProfile(req, res) {
  try {
    const { handle, bio, primaryStrategy, propBadges, isPublic } = req.body || {};
    const row = { user_id: req.userId, updated_at: new Date().toISOString() };
    if (handle !== undefined) {
      const clean = String(handle).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
      if (clean.length < 3) return fail(res, "Handle must be at least 3 letters, numbers or underscores.", 400);
      row.handle = clean;
    }
    if (bio !== undefined) row.bio = String(bio).slice(0, 280);
    if (primaryStrategy !== undefined) row.primary_strategy = String(primaryStrategy).slice(0, 40) || null;
    if (Array.isArray(propBadges)) row.prop_badges = propBadges.map((b) => String(b).slice(0, 30)).slice(0, 6);
    if (isPublic !== undefined) row.is_public = Boolean(isPublic);

    const { data, error } = await supabase.from("trader_profiles").upsert(row).select().single();
    if (error?.code === "23505") return fail(res, "That handle is taken.", 409);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function getTraderProfile(req, res) {
  try {
    const id = String(req.params.id);
    const [summaries, counts, followRow, posts, postsCount, stats, targetFollowers, myFollowing] = await Promise.all([
      getUserSummaries([id]),
      getFollowCounts(id),
      supabase.from("trader_follows").select("id").eq("follower_id", req.userId).eq("following_id", id).maybeSingle(),
      supabase.from("trader_posts").select("*").eq("user_id", id).is("parent_id", null).order("created_at", { ascending: false }).limit(30),
      supabase.from("trader_posts").select("id", { count: "exact", head: true }).eq("user_id", id).is("parent_id", null),
      supabase.rpc("get_lounge_leaderboard", { p_since: null, p_funded_only: false, p_limit: 500 }),
      getFollowerIds(id),
      getFollowingIds(req.userId),
    ]);
    const mineSet = new Set(myFollowing);
    const mutualIds = id === req.userId ? [] : targetFollowers.filter((uid) => mineSet.has(uid));
    const mutualSummaries = await getUserSummaries(mutualIds.slice(0, 3));
    const { data: followsMe } = await supabase
      .from("trader_follows").select("id").eq("follower_id", id).eq("following_id", req.userId).maybeSingle();
    const { data: profile } = await supabase.from("trader_profiles").select("bio").eq("user_id", id).maybeSingle();
    const board = stats.data || [];
    const rankIndex = board.findIndex((r) => r.user_id === id);

    res.json({
      ...summaries[id],
      bio: profile?.bio || "",
      ...counts,
      postsCount: postsCount.count || 0,
      mutualsCount: mutualIds.length,
      followedBy: mutualIds.slice(0, 3).map((uid) => mutualSummaries[uid]),
      isFollowing: Boolean(followRow.data),
      followsYou: Boolean(followsMe),
      isMutual: Boolean(followRow.data && followsMe),
      isOnline: isOnline(id),
      rank: rankIndex >= 0 ? rankIndex + 1 : null,
      stats: rankIndex >= 0 ? board[rankIndex] : null,
      posts: await hydratePosts(posts.data || [], req.userId),
    });
  } catch (err) {
    fail(res, err);
  }
}

// ── Leaderboard ─────────────────────────────────────────────────────────────

export async function getLeaderboard(req, res) {
  try {
    const { period = "all", funded, sort = "pnl" } = req.query;
    const since = period === "month" ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString() : null;
    const { data, error } = await supabase.rpc("get_lounge_leaderboard", {
      p_since: since,
      p_funded_only: funded === "1" || funded === "true",
      p_limit: 100,
    });
    if (error) throw error;

    const rows = [...(data || [])];
    if (sort === "winrate") rows.sort((a, b) => (b.win_rate || 0) - (a.win_rate || 0));
    const [summaries, following] = await Promise.all([
      getUserSummaries(rows.map((r) => r.user_id)),
      getFollowingIds(req.userId),
    ]);
    const followingSet = new Set(following);

    res.json(
      rows.map((r, i) => ({
        rank: i + 1,
        trader: summaries[r.user_id],
        totalTrades: r.total_trades,
        wins: r.wins,
        losses: r.losses,
        winRate: Number(r.win_rate || 0),
        totalPnl: Number(r.total_pnl || 0),
        profitFactor: r.profit_factor === null ? null : Number(r.profit_factor),
        consistencyScore: Number(r.consistency_score || 0),
        disciplinePct: Number(r.discipline_pct || 0),
        isFollowing: followingSet.has(r.user_id),
        isOnline: isOnline(r.user_id),
        isMe: r.user_id === req.userId,
      })),
    );
  } catch (err) {
    fail(res, err);
  }
}

// ── Follow graph ────────────────────────────────────────────────────────────

export async function follow(req, res) {
  try {
    const targetId = String(req.body?.targetId || "");
    if (!targetId || targetId === req.userId) return fail(res, "Invalid trader.", 400);
    const { error } = await supabase
      .from("trader_follows")
      .upsert({ follower_id: req.userId, following_id: targetId }, { onConflict: "follower_id,following_id", ignoreDuplicates: true });
    if (error) throw error;
    const me = (await getUserSummaries([req.userId]))[req.userId];
    emitToUser(targetId, "social:followed", { follower: me });
    res.json({ ok: true, ...(await getFollowCounts(targetId)) });
  } catch (err) {
    fail(res, err);
  }
}

export async function unfollow(req, res) {
  try {
    const targetId = String(req.body?.targetId || "");
    const { error } = await supabase.from("trader_follows").delete().eq("follower_id", req.userId).eq("following_id", targetId);
    if (error) throw error;
    res.json({ ok: true, ...(await getFollowCounts(targetId)) });
  } catch (err) {
    fail(res, err);
  }
}

// Followers, following, or mutuals: people the viewer follows who also follow this trader.
export async function listFollows(req, res) {
  try {
    const id = String(req.params.id);
    const kind = req.path.split("/").pop();
    const [targetFollowers, targetFollowing, mine] = await Promise.all([
      kind === "following" ? null : getFollowerIds(id),
      kind === "following" ? getFollowingIds(id) : null,
      getFollowingIds(req.userId),
    ]);
    const mineSet = new Set(mine);
    const ids =
      kind === "followers" ? targetFollowers : kind === "following" ? targetFollowing : targetFollowers.filter((uid) => mineSet.has(uid));
    const summaries = await getUserSummaries(ids);
    res.json(ids.map((uid) => ({ ...summaries[uid], isFollowing: mineSet.has(uid), isOnline: isOnline(uid) })));
  } catch (err) {
    fail(res, err);
  }
}

// ── Thought feed ────────────────────────────────────────────────────────────

export async function getFeed(req, res) {
  try {
    const { tab = "trending", cursor, userId } = req.query;
    let query = supabase.from("trader_posts").select("*").is("parent_id", null).limit(FEED_PAGE);

    if (userId) query = query.eq("user_id", String(userId));
    if (tab === "following") {
      const ids = await getFollowingIds(req.userId);
      query = query.in("user_id", [...ids, req.userId]);
    }
    if (tab === "setups") query = query.eq("is_setup", true);
    if (tab === "bookmarks") {
      const { data } = await supabase.from("trader_post_bookmarks").select("post_id").eq("user_id", req.userId);
      if (!data?.length) return res.json({ posts: [], nextCursor: null });
      query = query.in("id", data.map((b) => b.post_id));
    }

    if (tab === "trending") {
      const offset = Number(cursor) || 0;
      const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
      query = query
        .gte("created_at", weekAgo)
        .order("likes_count", { ascending: false })
        .order("reposts_count", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + FEED_PAGE - 1);
      const { data, error } = await query;
      if (error) throw error;
      const posts = await hydratePosts(data, req.userId);
      return res.json({ posts, nextCursor: posts.length === FEED_PAGE ? String(offset + FEED_PAGE) : null });
    }

    if (cursor) query = query.lt("created_at", cursor);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    const posts = await hydratePosts(data, req.userId);
    res.json({ posts, nextCursor: posts.length === FEED_PAGE ? posts[posts.length - 1].createdAt : null });
  } catch (err) {
    fail(res, err);
  }
}

export async function createPost(req, res) {
  try {
    const body = req.body || {};
    const content = String(body.content || "").trim().slice(0, 2000);
    if (!content && !req.files?.length) return fail(res, "Write something or add a photo first.", 400);

    const mediaUrls = [];
    for (const file of (req.files || []).slice(0, 4)) {
      mediaUrls.push(await uploadToCloudinary(file.buffer, "forex_notes_lounge"));
    }
    const sentiment = ["BULLISH", "BEARISH", "NEUTRAL"].includes(body.sentiment) ? body.sentiment : null;
    const tradeResult = ["WIN", "LOSS", "BE"].includes(body.tradeResult) ? body.tradeResult : null;
    const assetTag = (body.assetTag || content.match(ASSET_RE)?.[1] || "").toUpperCase().slice(0, 30) || null;

    const { data, error } = await supabase
      .from("trader_posts")
      .insert({
        user_id: req.userId,
        content,
        media_urls: mediaUrls,
        trade_id: body.tradeId || null,
        asset_tag: assetTag,
        sentiment,
        trade_result: tradeResult,
        is_setup: body.isSetup === true || body.isSetup === "true",
        parent_id: body.parentId || null,
      })
      .select()
      .single();
    if (error) throw error;

    const [post] = await hydratePosts([data], req.userId);
    if (data.parent_id) {
      const { data: parent } = await supabase.from("trader_posts").select("user_id").eq("id", data.parent_id).maybeSingle();
      if (parent && parent.user_id !== req.userId) emitToUser(parent.user_id, "social:reply", post);
    }
    res.status(201).json(post);
  } catch (err) {
    fail(res, err);
  }
}

export async function uploadImage(req, res) {
  try {
    if (!req.file) return fail(res, "Choose an image to upload.", 400);
    res.status(201).json({ url: await uploadToCloudinary(req.file.buffer, "forex_notes_lounge") });
  } catch (err) {
    fail(res, err);
  }
}

export async function getPost(req, res) {
  try {
    const { data: post } = await supabase.from("trader_posts").select("*").eq("id", req.params.id).maybeSingle();
    if (!post) return fail(res, "Post not found.", 404);
    const { data: replies } = await supabase
      .from("trader_posts").select("*").eq("parent_id", post.id).order("created_at", { ascending: true }).limit(100);
    const [hydrated] = await hydratePosts([post], req.userId);
    res.json({ ...hydrated, replies: await hydratePosts(replies || [], req.userId) });
  } catch (err) {
    fail(res, err);
  }
}

export async function deletePost(req, res) {
  try {
    const { error } = await supabase.from("trader_posts").delete().eq("id", req.params.id).eq("user_id", req.userId);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
}

const REACTION_TABLES = { like: "trader_post_likes", repost: "trader_post_reposts", bookmark: "trader_post_bookmarks" };

export async function toggleReaction(req, res) {
  try {
    const table = REACTION_TABLES[req.params.kind];
    if (!table) return fail(res, "Unknown action.", 400);
    const key = { post_id: req.params.id, user_id: req.userId };
    const { data: existing } = await supabase.from(table).select("post_id").match(key).maybeSingle();

    const { error } = existing ? await supabase.from(table).delete().match(key) : await supabase.from(table).insert(key);
    if (error) throw error;

    const { data: post } = await supabase
      .from("trader_posts").select("user_id, likes_count, reposts_count").eq("id", req.params.id).maybeSingle();
    if (!existing && post && post.user_id !== req.userId && req.params.kind !== "bookmark") {
      const me = (await getUserSummaries([req.userId]))[req.userId];
      emitToUser(post.user_id, "social:reaction", { kind: req.params.kind, postId: req.params.id, by: me });
    }
    res.json({ active: !existing, likesCount: post?.likes_count ?? 0, repostsCount: post?.reposts_count ?? 0 });
  } catch (err) {
    fail(res, err);
  }
}

// ── Messenger ───────────────────────────────────────────────────────────────

export async function listConversations(req, res) {
  try {
    const [{ data: parts }, { data: channels }] = await Promise.all([
      supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at, conversations!inner(id, is_group, is_public, title, slug, description, updated_at)")
        .eq("user_id", req.userId),
      supabase.from("conversations").select("id, is_group, is_public, title, slug, description, updated_at").eq("is_public", true),
    ]);

    const direct = (parts || []).filter((p) => !p.conversations.is_public);
    const ids = direct.map((p) => p.conversation_id);
    const { data: others } = ids.length
      ? await supabase.from("conversation_participants").select("conversation_id, user_id").in("conversation_id", ids).neq("user_id", req.userId)
      : { data: [] };
    const summaries = await getUserSummaries((others || []).map((o) => o.user_id));

    const withLast = async (conversation, lastReadAt) => {
      const { data: last } = await supabase
        .from("lounge_messages")
        .select("id, content, sender_id, created_at, is_trade_share")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      let unread = 0;
      if (lastReadAt) {
        const { count } = await supabase
          .from("lounge_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conversation.id)
          .neq("sender_id", req.userId)
          .gt("created_at", lastReadAt);
        unread = count || 0;
      }
      return { ...conversation, lastMessage: last || null, unread };
    };

    const dms = await Promise.all(
      direct.map(async (p) => {
        const peerIds = (others || []).filter((o) => o.conversation_id === p.conversation_id).map((o) => o.user_id);
        const peer = summaries[peerIds[0]] || null;
        return withLast({ ...p.conversations, peer: peer && { ...peer, isOnline: isOnline(peer.id) } }, p.last_read_at);
      }),
    );
    const rooms = await Promise.all((channels || []).map((c) => withLast(c, null)));

    dms.sort((a, b) => new Date(b.lastMessage?.created_at || b.updated_at) - new Date(a.lastMessage?.created_at || a.updated_at));
    res.json({ direct: dms, channels: rooms });
  } catch (err) {
    fail(res, err);
  }
}

export async function openDirectConversation(req, res) {
  try {
    const targetId = String(req.body?.userId || "");
    if (!targetId || targetId === req.userId) return fail(res, "Invalid trader.", 400);
    const { id } = await getOrCreateDirectConversation(req.userId, targetId);
    const peer = (await getUserSummaries([targetId]))[targetId];
    res.json({ id, is_group: false, is_public: false, peer: { ...peer, isOnline: isOnline(targetId) } });
  } catch (err) {
    fail(res, err);
  }
}

export async function getMessages(req, res) {
  try {
    const { id } = req.params;
    if (!(await canAccessConversation(id, req.userId))) return fail(res, "Not allowed.", 403);
    let query = supabase.from("lounge_messages").select("*").eq("conversation_id", id).order("created_at", { ascending: false }).limit(MESSAGES_PAGE);
    if (req.query.before) query = query.lt("created_at", req.query.before);
    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []).reverse();
    const senders = await getUserSummaries(rows.map((m) => m.sender_id));
    const { data: peers } = await supabase.from("conversation_participants").select("user_id, last_read_at").eq("conversation_id", id);
    res.json({
      messages: rows.map((m) => toMessageDto(m, senders[m.sender_id])),
      readState: Object.fromEntries((peers || []).map((p) => [p.user_id, p.last_read_at])),
      hasMore: (data || []).length === MESSAGES_PAGE,
    });
  } catch (err) {
    fail(res, err);
  }
}

export async function searchTraders(req, res) {
  try {
    const q = String(req.query.q || "").trim().replace(/^@/, "").slice(0, 40);
    if (q.length < 2) return res.json([]);
    const like = `%${q.replace(/[%_,()]/g, "")}%`;
    const [{ data: byName }, { data: byHandle }, byUsername] = await Promise.all([
      supabase.from("users").select("id").ilike("display_name", like).limit(10),
      supabase.from("trader_profiles").select("user_id").ilike("handle", like).limit(10),
      supabase.from("users").select("id").ilike("username", like).limit(10),
    ]);
    const ids = [
      ...new Set([
        ...(byUsername.data || []).map((u) => u.id),
        ...(byHandle || []).map((p) => p.user_id),
        ...(byName || []).map((u) => u.id),
      ]),
    ]
      .filter((id) => id !== req.userId)
      .slice(0, 12);
    const [summaries, mine] = await Promise.all([getUserSummaries(ids), getFollowingIds(req.userId)]);
    const mineSet = new Set(mine);
    res.json(ids.map((id) => ({ ...summaries[id], isFollowing: mineSet.has(id), isOnline: isOnline(id) })));
  } catch (err) {
    fail(res, err);
  }
}

export function getPresence(req, res) {
  res.json({ online: getOnlineUserIds() });
}

// ── Partner deals ───────────────────────────────────────────────────────────

export async function listDeals(req, res) {
  try {
    const nowIso = new Date().toISOString();
    const [{ data, error }, board] = await Promise.all([
      supabase
        .from("partnership_deals")
        .select("*")
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.rpc("get_lounge_leaderboard", { p_since: null, p_funded_only: false, p_limit: 500 }),
    ]);
    if (error) throw error;
    const idx = (board.data || []).findIndex((r) => r.user_id === req.userId);
    const myRank = idx >= 0 ? idx + 1 : null;

    res.json({
      myRank,
      deals: (data || []).map((d) => {
        const locked = d.min_rank_required > 0 && (!myRank || myRank > d.min_rank_required);
        return { ...d, locked, promo_code: locked ? null : d.promo_code, affiliate_url: locked ? null : d.affiliate_url };
      }),
    });
  } catch (err) {
    fail(res, err);
  }
}

const DEAL_FIELDS = [
  "partner_name", "partner_type", "logo_url", "headline", "reward_description",
  "promo_code", "affiliate_url", "min_rank_required", "expires_at", "is_featured", "is_active",
];
const pickDeal = (body = {}) => Object.fromEntries(DEAL_FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, body[k] === "" ? null : body[k]]));

export async function createDeal(req, res) {
  try {
    const { data, error } = await supabase.from("partnership_deals").insert(pickDeal(req.body)).select().single();
    if (error) return fail(res, error.message, 400);
    broadcastDeal({ ...data, promo_code: null, affiliate_url: null });
    res.status(201).json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function updateDeal(req, res) {
  try {
    const { data, error } = await supabase.from("partnership_deals").update(pickDeal(req.body)).eq("id", req.params.id).select().single();
    if (error) return fail(res, error.message, 400);
    res.json(data);
  } catch (err) {
    fail(res, err);
  }
}

export async function deleteDeal(req, res) {
  try {
    const { error } = await supabase.from("partnership_deals").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
}

export async function listAllDeals(req, res) {
  try {
    const { data, error } = await supabase.from("partnership_deals").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    fail(res, err);
  }
}
