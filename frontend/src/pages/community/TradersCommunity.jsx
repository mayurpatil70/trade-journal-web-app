import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  MessagesSquare,
  Plus,
  Compass,
  Hash,
  ChevronDown,
  UserPlus,
  Settings,
  LogOut,
  Trash2,
  Search,
  Users,
  Loader2,
  Globe,
  Lock,
  Crown,
  Shield,
} from "lucide-react";
import api from "../../api/axios";
import { glass, Avatar, EmptyState } from "../../components/lounge/LoungeUI";
import { ChatThread, ConversationList, useConversations, openDirect } from "../../components/lounge/Messenger";
import UserHover from "../../components/lounge/UserHoverCard";
import InstallAppButton from "../../components/InstallAppButton";
import { useOnlineSet } from "../../lib/socket";
import { useMe } from "../lounge/LoungeFeed";
import {
  ServerIcon,
  CreateServerDialog,
  InviteDialog,
  CreateChannelDialog,
  ServerSettingsDialog,
  errorText,
} from "../../components/community/CommunityDialogs";

const isDesktop = () => window.innerWidth >= 768;
const column = "flex flex-col min-h-0 bg-black/[0.015] dark:bg-white/[0.015] border-r border-black/[0.05] dark:border-white/[0.06]";

function useMyServers() {
  const [servers, setServers] = useState(null);
  const refresh = useCallback(() => {
    api
      .get("/api/social/servers")
      .then(({ data }) => setServers(Array.isArray(data) ? data : []))
      .catch(() => setServers((s) => s || []));
  }, []);
  useEffect(refresh, [refresh]);
  return [servers, setServers, refresh];
}

function RailButton({ active, label, onClick, children }) {
  return (
    <div className="relative group flex justify-center w-full">
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-neutral-900 dark:bg-white transition-all ${
          active ? "h-9" : "h-0 group-hover:h-4"
        }`}
      />
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        className={`transition-all duration-200 active:scale-95 ${active ? "rounded-[14px]" : "rounded-[24px] hover:rounded-[14px]"} overflow-hidden`}
      >
        {children}
      </button>
      <span className="pointer-events-none hidden md:block absolute left-[64px] top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
        {label}
      </span>
    </div>
  );
}

function ServerRail({ servers, activeId, view, onCreate }) {
  const navigate = useNavigate();
  const circle = (active, content, tone = "") => (
    <span
      className={`w-12 h-12 flex items-center justify-center ${
        active ? "bg-[#0066FF] text-white" : tone || "bg-white dark:bg-white/[0.07] text-[#0066FF] dark:text-sky-400 hover:bg-[#0066FF] hover:text-white"
      } transition-colors`}
    >
      {content}
    </span>
  );

  return (
    <nav className="w-[72px] shrink-0 flex flex-col items-center gap-2 py-3 overflow-y-auto no-scrollbar bg-black/[0.035] dark:bg-black/30 border-r border-black/[0.05] dark:border-white/[0.06]">
      <RailButton active={view === "home"} label="Direct messages" onClick={() => navigate("/community")}>
        {circle(view === "home", <MessagesSquare className="w-5 h-5" />)}
      </RailButton>
      <span className="w-8 h-px bg-black/10 dark:bg-white/10 my-0.5" />
      {(servers || []).map((s) => (
        <RailButton key={s.id} active={activeId === s.id} label={s.name} onClick={() => navigate(`/community/s/${s.id}`)}>
          <ServerIcon server={s} size={48} rounded="" />
        </RailButton>
      ))}
      <RailButton label="Create or join a server" onClick={onCreate}>
        {circle(false, <Plus className="w-5 h-5" />, "bg-white dark:bg-white/[0.07] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white")}
      </RailButton>
      <RailButton active={view === "discover"} label="Discover servers" onClick={() => navigate("/community/discover")}>
        {circle(view === "discover", <Compass className="w-5 h-5" />)}
      </RailButton>
    </nav>
  );
}

function HomeView({ me, onChatChange }) {
  const convos = useConversations();
  const [active, setActive] = useState(null);
  const [params, setParams] = useSearchParams();
  const withUser = params.get("with");

  useEffect(() => {
    if (!withUser) return;
    openDirect(withUser)
      .then((c) => {
        setActive(c);
        convos.refresh();
      })
      .catch(() => {})
      .finally(() => setParams({}, { replace: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withUser]);

  useEffect(() => {
    if (!active && !withUser && convos.channels.length && isDesktop()) setActive(convos.channels[0]);
  }, [active, withUser, convos.channels]);

  useEffect(() => {
    onChatChange(Boolean(active));
  }, [active, onChatChange]);

  const startWith = async (user) => {
    setActive(await openDirect(user.id));
    convos.refresh();
  };

  return (
    <>
      <div className={`${column} w-full md:w-[300px] ${active ? "hidden md:flex" : "flex"}`}>
        <div className="h-14 shrink-0 flex items-center justify-between gap-2 px-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          <span className="text-[15px] font-bold text-neutral-900 dark:text-white truncate">Traders Community</span>
          <InstallAppButton variant="icon" />
        </div>
        <div className="flex-1 min-h-0">
          <ConversationList {...convos} me={me} activeId={active?.id} onSelect={setActive} onStartWith={startWith} />
        </div>
      </div>
      <div className={`flex-1 min-w-0 min-h-0 ${active ? "flex" : "hidden md:flex"} flex-col`}>
        {active ? (
          <ChatThread key={active.id} conversation={active} me={me} backMobileOnly onBack={() => setActive(null)} onRead={(id) => convos.markUnread(id, 0)} />
        ) : (
          <div className="m-auto">
            <EmptyState icon={MessagesSquare} title="Pick a conversation" body="Chat 1-on-1 with traders, or open a server you joined or created." />
          </div>
        )}
      </div>
    </>
  );
}

const ROLE_ICON = { owner: Crown, admin: Shield };

function MembersPanel({ serverId }) {
  const [members, setMembers] = useState(null);
  const online = useOnlineSet();

  useEffect(() => {
    setMembers(null);
    api
      .get(`/api/social/servers/${serverId}/members`)
      .then(({ data }) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]));
  }, [serverId]);

  const groups = useMemo(() => {
    const list = members || [];
    return [
      { label: "Online", items: list.filter((m) => online.has(m.id)) },
      { label: "Offline", items: list.filter((m) => !online.has(m.id)) },
    ].filter((g) => g.items.length);
  }, [members, online]);

  return (
    <aside className="hidden xl:flex w-[240px] shrink-0 flex-col min-h-0 border-l border-black/[0.05] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.015]">
      <div className="h-14 shrink-0 flex items-center gap-2 px-4 border-b border-black/[0.05] dark:border-white/[0.06] text-sm font-bold text-neutral-900 dark:text-white">
        <Users className="w-4 h-4 text-neutral-400" /> Members
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 space-y-4">
        {!members ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.label}>
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {g.label} — {g.items.length}
              </p>
              {g.items.map((m) => {
                const RoleIcon = ROLE_ICON[m.role];
                return (
                  <UserHover key={m.id} user={m} className="block">
                    <span className={`flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.05] ${g.label === "Offline" ? "opacity-60" : ""}`}>
                      <Avatar user={m} size={32} online={online.has(m.id)} />
                      <span className="min-w-0 flex-1 text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">{m.displayName}</span>
                      {RoleIcon && <RoleIcon className={`w-3.5 h-3.5 shrink-0 ${m.role === "owner" ? "text-amber-500" : "text-[#0066FF]"}`} />}
                    </span>
                  </UserHover>
                );
              })}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function ServerView({ serverId, channelId, me, onServersChange }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError("");
    api
      .get(`/api/social/servers/${serverId}`)
      .then(({ data: d }) => alive && setData(d))
      .catch((err) => alive && setError(errorText(err, "Could not open this server.")));
    return () => {
      alive = false;
    };
  }, [serverId]);

  const channels = useMemo(() => data?.channels || [], [data]);
  const active = channels.find((c) => c.id === channelId) || null;

  useEffect(() => {
    if (!channelId && channels.length && isDesktop()) navigate(`/community/s/${serverId}/${channels[0].id}`, { replace: true });
  }, [channelId, channels, serverId, navigate]);

  if (error) {
    return (
      <div className="flex-1 flex">
        <div className="m-auto">
          <EmptyState icon={Lock} title={error} action={<Link to="/community/discover" className="text-sm font-semibold text-[#0066FF]">Discover servers</Link>} />
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  const { server } = data;
  const isMember = Boolean(server.role);
  const manage = server.role === "owner" || server.role === "admin";

  const join = async () => {
    setJoining(true);
    try {
      const { data: d } = await api.post(`/api/social/servers/${server.id}/join`);
      setData(d);
      onServersChange();
    } catch (err) {
      setError(errorText(err, "Could not join this server."));
    } finally {
      setJoining(false);
    }
  };

  const leave = async () => {
    if (!window.confirm(`Leave ${server.name}?`)) return;
    try {
      await api.post(`/api/social/servers/${server.id}/leave`);
      onServersChange();
      navigate("/community");
    } catch (err) {
      window.alert(errorText(err, "Could not leave the server."));
    }
  };

  const removeChannel = async (c) => {
    if (!window.confirm(`Delete #${c.title}? Its messages will be removed.`)) return;
    try {
      await api.delete(`/api/social/servers/${server.id}/channels/${c.id}`);
      const rest = channels.filter((x) => x.id !== c.id);
      setData((d) => ({ ...d, channels: rest }));
      if (c.id === channelId) navigate(`/community/s/${server.id}`, { replace: true });
    } catch (err) {
      window.alert(errorText(err, "Could not delete the channel."));
    }
  };

  const menu = [
    { label: "Invite people", icon: UserPlus, show: isMember, run: () => setDialog("invite"), tone: "text-[#0066FF] dark:text-sky-400" },
    { label: "Create channel", icon: Plus, show: manage, run: () => setDialog("channel") },
    { label: "Server settings", icon: Settings, show: manage, run: () => setDialog("settings") },
    { label: "Leave server", icon: LogOut, show: isMember && server.role !== "owner", run: leave, tone: "text-red-500" },
  ].filter((m) => m.show);

  return (
    <>
      <div className={`${column} w-full md:w-[260px] ${active ? "hidden md:flex" : "flex"}`}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="w-full h-14 shrink-0 flex items-center justify-between gap-2 px-4 border-b border-black/[0.05] dark:border-white/[0.06] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
          >
            <span className="flex items-center gap-1.5 min-w-0">
              {server.isPublic ? <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> : <Lock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
              <span className="text-[15px] font-bold text-neutral-900 dark:text-white truncate">{server.name}</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>
          {menuOpen && menu.length > 0 && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute z-50 left-2 right-2 top-[58px] rounded-2xl bg-white/95 dark:bg-[#1b2030]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
                {menu.map(({ label, icon: Icon, run, tone }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      run();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06] ${tone || "text-neutral-800 dark:text-neutral-100"}`}
                  >
                    {label}
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3">
          {server.description && <p className="px-2 pb-3 text-xs text-neutral-500 leading-snug">{server.description}</p>}
          {isMember && (
            <button
              type="button"
              onClick={() => setDialog("invite")}
              className="w-full mb-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold py-2"
            >
              <UserPlus className="w-3.5 h-3.5" /> Invite people
            </button>
          )}
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Text channels</span>
            {manage && (
              <button type="button" onClick={() => setDialog("channel")} className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white" aria-label="Create channel">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          {channels.map((c) => (
            <div key={c.id} className="group relative">
              <button
                type="button"
                onClick={() => navigate(`/community/s/${server.id}/${c.id}`)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-[14px] transition-colors ${
                  c.id === channelId
                    ? "bg-blue-500/10 text-neutral-900 dark:text-white font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <Hash className="w-4 h-4 shrink-0 opacity-70" />
                <span className="truncate">{c.title}</span>
              </button>
              {manage && channels.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeChannel(c)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                  aria-label={`Delete ${c.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {!isMember && (
          <div className="p-3 border-t border-black/[0.05] dark:border-white/[0.06]">
            <p className="text-xs text-neutral-500 mb-2">You're previewing {server.name}.</p>
            <button onClick={join} disabled={joining} className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-2.5 disabled:opacity-60">
              {joining ? "Joining…" : "Join server"}
            </button>
          </div>
        )}
      </div>

      <div className={`flex-1 min-w-0 min-h-0 ${active ? "flex" : "hidden md:flex"} flex-col`}>
        {active && isMember ? (
          <ChatThread key={active.id} conversation={active} me={me} canModerate={manage} backMobileOnly onBack={() => navigate(`/community/s/${server.id}`)} />
        ) : active ? (
          <div className="m-auto">
            <EmptyState
              icon={Hash}
              title={`Join ${server.name} to read #${active.title}`}
              body={`${server.memberCount} member${server.memberCount === 1 ? "" : "s"}`}
              action={
                <button onClick={join} disabled={joining} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-60">
                  {joining ? "Joining…" : "Join server"}
                </button>
              }
            />
          </div>
        ) : (
          <div className="m-auto">
            <EmptyState icon={Hash} title="Pick a channel" />
          </div>
        )}
      </div>

      <MembersPanel serverId={server.id} key={`${server.id}-${server.memberCount}`} />

      {dialog === "invite" && (
        <InviteDialog
          server={server}
          canManage={manage}
          onClose={() => setDialog(null)}
          onReset={(code) => setData((d) => ({ ...d, server: { ...d.server, inviteCode: code } }))}
        />
      )}
      {dialog === "channel" && (
        <CreateChannelDialog
          server={server}
          onClose={() => setDialog(null)}
          onCreated={(c) => {
            setData((d) => ({ ...d, channels: [...d.channels, c] }));
            navigate(`/community/s/${server.id}/${c.id}`);
          }}
        />
      )}
      {dialog === "settings" && (
        <ServerSettingsDialog
          server={server}
          isOwner={server.role === "owner"}
          onClose={() => setDialog(null)}
          onSaved={(s) => {
            setData((d) => ({ ...d, server: { ...d.server, ...s } }));
            onServersChange();
          }}
          onDeleted={() => {
            onServersChange();
            navigate("/community");
          }}
        />
      )}
    </>
  );
}

function DiscoverView({ onServersChange }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [list, setList] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get("/api/social/servers/discover", { params: { q } })
        .then(({ data }) => setList(Array.isArray(data) ? data : []))
        .catch(() => setList([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const join = async (s) => {
    if (s.role) return navigate(`/community/s/${s.id}`);
    setBusyId(s.id);
    try {
      await api.post(`/api/social/servers/${s.id}/join`);
      onServersChange();
      navigate(`/community/s/${s.id}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
      <div className="relative px-5 sm:px-8 pt-8 pb-6 bg-gradient-to-br from-[#0066FF] to-sky-500 text-white">
        <h2 className="text-2xl font-bold tracking-tight">Find your trading community</h2>
        <p className="text-sm text-white/80 mt-1">Public servers for every style: scalpers, swing traders, prop challenges and more.</p>
        <div className="relative mt-4 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search servers" className="w-full rounded-xl bg-white pl-9 pr-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-white/60 shadow-sm" />
        </div>
      </div>
      <div className="p-4 sm:p-6">
        {!list ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={Compass} title={q ? "No servers match that search" : "No public servers yet"} body="Create one with the + button and invite your trading friends." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
            {list.map((s) => (
              <div key={s.id} className="rounded-3xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-white/[0.03] flex flex-col">
                <div className="h-20 bg-gradient-to-br from-blue-500/25 to-sky-400/20 relative">
                  <ServerIcon server={s} size={56} className="absolute -bottom-6 left-4 ring-4 ring-white dark:ring-[#12151e]" />
                </div>
                <div className="pt-8 px-4 pb-4 flex-1 flex flex-col">
                  <p className="font-bold text-neutral-900 dark:text-white truncate">{s.name}</p>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2 flex-1">{s.description || "A Forex Notes trading community."}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-neutral-500 inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {s.memberCount} member{s.memberCount === 1 ? "" : "s"}
                    </span>
                    <button
                      onClick={() => join(s)}
                      disabled={busyId === s.id}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                        s.role ? "bg-black/[0.05] dark:bg-white/[0.08] text-neutral-800 dark:text-white" : "bg-[#0066FF] text-white hover:bg-[#0052CC]"
                      }`}
                    >
                      {s.role ? "Open" : busyId === s.id ? "Joining…" : "Join"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TradersCommunity() {
  const { serverId, channelId } = useParams();
  const { pathname } = useLocation();
  const me = useMe();
  const [servers, setServers, refreshServers] = useMyServers();
  const [creating, setCreating] = useState(false);
  const [homeChat, setHomeChat] = useState(false);
  const view = pathname.startsWith("/community/discover") ? "discover" : serverId ? "server" : "home";
  const chatOpen = Boolean(channelId) || (view === "home" && homeChat);

  return (
    <div className="w-full max-w-[1600px] mx-auto md:px-4 lg:px-6 md:py-4">
      <div className={`${glass} !rounded-none !border-x-0 md:!border-x md:!rounded-3xl overflow-hidden flex h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-2rem)]`}>
        <div className={chatOpen ? "hidden md:flex" : "flex"}>
          <ServerRail servers={servers} activeId={serverId} view={view} onCreate={() => setCreating(true)} />
        </div>
        {view === "home" && <HomeView me={me} onChatChange={setHomeChat} />}
        {view === "server" && <ServerView key={serverId} serverId={serverId} channelId={channelId} me={me} onServersChange={refreshServers} />}
        {view === "discover" && <DiscoverView onServersChange={refreshServers} />}
      </div>
      {creating && <CreateServerDialog onClose={() => setCreating(false)} onCreated={(s) => setServers((list) => [...(list || []), s])} />}
    </div>
  );
}

export function CommunityInvite() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api
      .get(`/api/social/invites/${code}`)
      .then(({ data }) => setInvite(data))
      .catch((err) => setError(errorText(err, "This invite link is invalid.")));
  }, [code]);

  const accept = async () => {
    if (invite.isMember) return navigate(`/community/s/${invite.id}`);
    setJoining(true);
    try {
      const { data } = await api.post(`/api/social/invites/${code}/join`);
      navigate(`/community/s/${data.server.id}/${data.channels[0]?.id || ""}`);
    } catch (err) {
      setError(errorText(err, "Could not join this server."));
      setJoining(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-7rem)] flex items-center justify-center p-4">
      <div className={`${glass} w-full max-w-sm p-7 text-center`}>
        {error ? (
          <EmptyState icon={Lock} title={error} action={<Link to="/community" className="text-sm font-semibold text-[#0066FF]">Go to Traders Community</Link>} />
        ) : !invite ? (
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400 mx-auto my-10" />
        ) : (
          <>
            <ServerIcon server={invite} size={80} rounded="rounded-[24px]" className="mx-auto" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {invite.owner?.displayName || "A trader"} invited you to join
            </p>
            <h1 className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">{invite.name}</h1>
            {invite.description && <p className="mt-2 text-sm text-neutral-500">{invite.description}</p>}
            <p className="mt-3 text-xs text-neutral-500 inline-flex items-center gap-1.5">
              {invite.isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {invite.isPublic ? "Public" : "Private"} · {invite.memberCount} member{invite.memberCount === 1 ? "" : "s"}
            </p>
            <button onClick={accept} disabled={joining} className="mt-6 w-full rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-semibold py-3 disabled:opacity-60">
              {invite.isMember ? "Open server" : joining ? "Joining…" : "Accept invite"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
