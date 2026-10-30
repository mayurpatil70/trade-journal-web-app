import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Loader2, MessageCircle } from "lucide-react";
import api from "../../api/axios";
import { openChatWith } from "../../lib/socket";
import { Avatar, TraderName, FollowButton, pill } from "./LoungeUI";
import { LinkChips } from "./ProfileLinks";

const CARD_TTL_MS = 60_000;
const CARD_W = 300;
const cardCache = new Map();

function loadCard(id) {
  const hit = cardCache.get(id);
  if (hit && Date.now() - hit.at < CARD_TTL_MS) return hit.promise;
  const promise = api.get(`/api/social/traders/${id}/card`).then(({ data }) => data);
  cardCache.set(id, { at: Date.now(), promise });
  promise.catch(() => cardCache.delete(id));
  return promise;
}

const canHover = () => window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

function Card({ user, pos, onEnter, onLeave }) {
  const [card, setCard] = useState(null);
  const [busy, setBusy] = useState(false);
  const isMe = String(user.id) === localStorage.getItem("userId");

  useEffect(() => {
    let alive = true;
    loadCard(user.id).then((d) => alive && setCard(d)).catch(() => alive && setCard({ error: true }));
    return () => {
      alive = false;
    };
  }, [user.id]);

  const toggleFollow = async () => {
    setBusy(true);
    const next = !card.isFollowing;
    try {
      const { data } = await api.post(`/api/social/${next ? "follow" : "unfollow"}`, { targetId: user.id });
      const updated = { ...card, isFollowing: next, followers: data.followers };
      setCard(updated);
      cardCache.set(user.id, { at: Date.now(), promise: Promise.resolve(updated) });
    } finally {
      setBusy(false);
    }
  };

  const shown = card && !card.error ? card : user;
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ top: pos.top, left: pos.left, width: CARD_W }}
      className="fixed z-[9600] rounded-3xl bg-white/95 dark:bg-[#161a24]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.22)] p-4 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-start gap-3">
        <Avatar user={shown} size={56} online={card?.isOnline} />
        <div className="min-w-0 flex-1">
          <TraderName user={shown} className="text-[15px]" />
          <p className="text-xs text-neutral-500 truncate">@{shown.handle}</p>
          {card?.followsYou && !isMe && (
            <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] text-neutral-500">Follows you</span>
          )}
        </div>
      </div>

      {!card ? (
        <div className="py-5 flex justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
        </div>
      ) : card.error ? null : (
        <>
          <div className="mt-3 grid grid-cols-3 text-center">
            {[
              ["posts", card.postsCount],
              ["followers", card.followers],
              ["following", card.following],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-sm font-bold text-neutral-900 dark:text-white">{value ?? 0}</div>
                <div className="text-[11px] text-neutral-500">{label}</div>
              </div>
            ))}
          </div>
          {card.bio && <p className="mt-3 text-[13px] leading-snug text-neutral-700 dark:text-neutral-300 whitespace-pre-line line-clamp-4">{card.bio}</p>}
          {card.links?.length > 0 && (
            <div className="mt-3">
              <LinkChips links={card.links} max={3} />
            </div>
          )}
          {!isMe && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <FollowButton following={card.isFollowing} busy={busy} onClick={toggleFollow} />
              <button
                type="button"
                onClick={() => openChatWith(card)}
                className={`${pill} justify-center bg-black/[0.05] dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-100 hover:bg-black/[0.08] dark:hover:bg-white/[0.12]`}
              >
                <MessageCircle className="w-3.5 h-3.5" /> Message
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Wraps an avatar or name: click opens the profile, hover (mouse only) shows a profile card.
export default function UserHover({ user, children, className = "" }) {
  const navigate = useNavigate();
  const ref = useRef(null);
  const openTimer = useRef(null);
  const closeTimer = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(
    () => () => {
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
    },
    [],
  );

  if (!user?.id) return children;

  const show = () => {
    clearTimeout(closeTimer.current);
    if (pos || !canHover()) return;
    openTimer.current = setTimeout(() => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const left = Math.min(Math.max(8, r.left), window.innerWidth - CARD_W - 8);
      const below = r.bottom + 8;
      const top = below + 320 > window.innerHeight ? Math.max(8, r.top - 328) : below;
      setPos({ top, left });
    }, 350);
  };
  const hide = () => {
    clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setPos(null), 180);
  };

  return (
    <>
      <span
        ref={ref}
        role="link"
        tabIndex={0}
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={(e) => {
          e.stopPropagation();
          setPos(null);
          navigate(`/lounge/trader/${user.id}`);
        }}
        onKeyDown={(e) => e.key === "Enter" && navigate(`/lounge/trader/${user.id}`)}
        className={`cursor-pointer ${className}`}
      >
        {children}
      </span>
      {pos && createPortal(<Card user={user} pos={pos} onEnter={() => clearTimeout(closeTimer.current)} onLeave={hide} />, document.body)}
    </>
  );
}
