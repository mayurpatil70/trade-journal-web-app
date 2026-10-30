// frontend/src/pages/lounge/LoungeMessages.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessagesSquare } from "lucide-react";
import { glass, EmptyState } from "../../components/lounge/LoungeUI";
import { ChatThread, ConversationList, useConversations, openDirect } from "../../components/lounge/Messenger";
import { useMe } from "./LoungeFeed";

export default function LoungeMessages({ fullscreen = false }) {
  const me = useMe();
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
    if (!active && !withUser && convos.channels.length && window.innerWidth >= 768) setActive(convos.channels[0]);
  }, [active, withUser, convos.channels]);

  const startWith = async (user) => {
    const c = await openDirect(user.id);
    setActive(c);
    convos.refresh();
  };

  return (
    <div
      className={`${glass} overflow-hidden grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] ${
        fullscreen ? "h-[calc(100dvh-7rem)]" : "h-[calc(100dvh-16rem)] min-h-[520px]"
      }`}
    >
      <div className={`border-r border-black/[0.05] dark:border-white/[0.06] min-h-0 ${active ? "hidden md:block" : ""}`}>
        <ConversationList
          {...convos}
          me={me}
          activeId={active?.id}
          onSelect={setActive}
          onStartWith={startWith}
        />
      </div>
      <div className={`min-h-0 ${active ? "" : "hidden md:block"}`}>
        {active ? (
          <ChatThread
            key={active.id}
            conversation={active}
            me={me}
            onBack={() => setActive(null)}
            onRead={(id) => convos.markUnread(id, 0)}
          />
        ) : (
          <EmptyState icon={MessagesSquare} title="Pick a conversation" body="Chat 1-on-1 with traders or jump into a public channel." />
        )}
      </div>
    </div>
  );
}
