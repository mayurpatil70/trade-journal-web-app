import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";

const CATEGORIES = [
  { id: "smileys", icon: "😀", name: "Smileys", set: "😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗☺️😚😙🥲😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬🤥😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵🤯🤠🥳🥸😎🤓🧐😕😟🙁☹️😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈👿💀☠️💩🤡👹👺👻👽👾🤖😺😸😹😻😼😽🙀😿😾" },
  { id: "people", icon: "👋", name: "People", set: "👋🤚🖐✋🖖👌🤌🤏✌️🤞🤟🤘🤙👈👉👆🖕👇☝️👍👎✊👊🤛🤜👏🙌👐🤲🤝🙏✍️💅🤳💪🦾🦵🦶👂👃🧠🫀🫁🦷🦴👀👁👅👄💋👶🧒👦👧🧑👨👩🧔👱🧓👴👵🙍🙎🙅🙆💁🙋🧏🙇🤦🤷👮🕵💂👷🤴👸👳👲🧕🤵👰🤰🤱👼🎅🤶🦸🦹🧙🧚🧛🧜🧝🧞🧟💆💇🚶🏃💃🕺👯🧖🧗🏇⛷🏂🏌🏄🚣🏊⛹🏋🚴🚵🤸🤼🤽🤾🤹🧘🛀🛌" },
  { id: "nature", icon: "🐶", name: "Nature", set: "🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🙈🙉🙊🐒🐔🐧🐦🐤🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐜🐢🐍🦎🐙🦑🦐🦀🐡🐠🐟🐬🐳🐋🦈🐊🐅🐆🦓🦍🐘🦏🐪🐫🦒🐃🐂🐄🐎🐖🐏🐑🐐🦌🐕🐩🐈🐓🦃🕊🐇🐁🐀🐿🦔🐾🐉🌵🎄🌲🌳🌴🌱🌿☘️🍀🎍🎋🍃🍂🍁🍄🌾💐🌷🌹🥀🌺🌸🌼🌻🌞🌝🌛🌜🌚🌕🌖🌗🌘🌑🌒🌓🌔🌙🌎🌍🌏💫⭐🌟✨⚡☄️💥🔥🌪🌈☀️🌤⛅☁️🌦🌧⛈🌩❄️☃️⛄🌬💨💧💦☔🌊" },
  { id: "food", icon: "🍔", name: "Food", set: "🍏🍎🍐🍊🍋🍌🍉🍇🍓🍈🍒🍑🥭🍍🥥🥝🍅🍆🥑🥦🥬🥒🌶🌽🥕🧄🧅🥔🍠🥐🥯🍞🥖🥨🧀🥚🍳🧈🥞🧇🥓🥩🍗🍖🌭🍔🍟🍕🥪🥙🧆🌮🌯🥗🥘🍝🍜🍲🍛🍣🍱🥟🍤🍙🍚🍘🍥🥠🥮🍢🍡🍧🍨🍦🥧🧁🍰🎂🍮🍭🍬🍫🍿🍩🍪🌰🥜🍯🥛🍼☕🍵🧃🥤🍶🍺🍻🥂🍷🥃🍸🍹🧉🍾🧊🥄🍴🍽🥣🥡🥢" },
  { id: "activity", icon: "⚽", name: "Activity", set: "⚽🏀🏈⚾🥎🎾🏐🏉🥏🎱🪀🏓🏸🏒🏑🥍🏏🥅⛳🪁🏹🎣🤿🥊🥋🎽🛹🛼🛷⛸🥌🎿⛷🏂🏋🤼🤸⛹🤺🤾🏌🏇🧘🏄🏊🤽🚣🧗🚵🚴🏆🥇🥈🥉🏅🎖🏵🎗🎫🎟🎪🤹🎭🎨🎬🎤🎧🎼🎹🥁🎷🎺🎸🪕🎻🎲♟🎯🎳🎮🎰🧩" },
  { id: "travel", icon: "🚗", name: "Travel", set: "🚗🚕🚙🚌🚎🏎🚓🚑🚒🚐🚚🚛🚜🛵🏍🚲🛴🚨🚔🚍🚘🚖🚡🚠🚟🚃🚋🚞🚝🚄🚅🚈🚂🚆🚇🚊🚉✈️🛫🛬🛩💺🛰🚀🛸🚁🛶⛵🚤🛥🛳⛴🚢⚓⛽🚧🚦🚥🗺🗿🗽🗼🏰🏯🏟🎡🎢🎠⛲⛱🏖🏝🏜🌋⛰🏔🗻🏕⛺🏠🏡🏘🏢🏣🏤🏥🏦🏨🏪🏫🏬🏭🏗🌃🏙🌄🌅🌆🌇🌉🌌" },
  { id: "objects", icon: "💡", name: "Objects", set: "⌚📱💻⌨️🖥🖨🖱💽💾💿📀📷📸📹🎥📞☎️📟📠📺📻🧭⏱⏲⏰🕰⌛⏳📡🔋🔌💡🔦🕯🧯💸💵💴💶💷💰💳💎⚖️🧰🔧🔨⚒🛠⛏🔩⚙️🧱⛓🧲🔫💣🧨🪓🔪🗡⚔️🛡🚬⚰️🏺🔮📿🧿💈⚗️🔭🔬🕳💊💉🩸🩹🌡🧬🦠🧫🧪🧹🧺🧻🚽🚿🛁🧼🧽🧴🔑🗝🚪🛋🛏🧸🖼🛍🛒🎁🎈🎏🎀🎊🎉🎎🏮🎐✉️📩📨📧💌📥📤📦🏷📪📫📮📜📃📄📑🧾📊📈📉🗒🗓📆📅🗑📇🗃🗳🗄📋📁📂🗂🗞📰📓📔📒📕📗📘📙📚📖🔖🧷🔗📎🖇📐📏🧮📌📍✂️🖊🖋✒️🖌🖍📝✏️🔍🔎🔏🔐🔒🔓" },
  { id: "symbols", icon: "❤️", name: "Symbols", set: "❤️🧡💛💚💙💜🖤🤍🤎💔❣️💕💞💓💗💖💘💝💟☮️✝️☪️🕉☸️✡️🔯🕎☯️☦️🛐⛎♈♉♊♋♌♍♎♏♐♑♒♓🆔⚛️🉑☢️☣️📴📳🈶🈚🈸🈺🈷️✴️🆚💮🉐㊙️㊗️🈴🈵🈹🈲🅰️🅱️🆎🆑🅾️🆘❌⭕🛑⛔📛🚫💯💢♨️🚷🚯🚳🚱🔞📵🚭❗❕❓❔‼️⁉️🔅🔆〽️⚠️🚸🔱⚜️🔰♻️✅🈯💹❇️✳️❎🌐💠Ⓜ️🌀💤🏧🚾♿🅿️🈳🈂️🛂🛃🛄🛅🚹🚺🚼🚻🚮🎦📶🈁🔣ℹ️🔤🔡🔠🆖🆗🆙🆒🆕🆓0️⃣1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟🔢#️⃣*️⃣⏏️▶️⏸⏯⏹⏺⏭⏮⏩⏪⏫⏬◀️🔼🔽➡️⬅️⬆️⬇️↗️↘️↙️↖️↕️↔️↪️↩️⤴️⤵️🔀🔁🔂🔄🔃🎵🎶➕➖➗✖️♾💲💱™️©️®️〰️➰➿🔚🔙🔛🔝🔜✔️☑️🔘🔴🟠🟡🟢🔵🟣⚫⚪🟤🔺🔻🔸🔹🔶🔷🔳🔲▪️▫️◾◽◼️◻️🟥🟧🟨🟩🟦🟪⬛⬜🔈🔇🔉🔊🔔🔕📣📢👁‍🗨💬💭🗯♠️♣️♥️♦️🃏🎴🀄🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛" },
  { id: "flags", icon: "🏁", name: "Flags", set: "🏁🚩🎌🏴🏳️🇮🇳🇺🇸🇬🇧🇦🇪🇸🇬🇯🇵🇨🇳🇰🇷🇦🇺🇨🇦🇩🇪🇫🇷🇮🇹🇪🇸🇧🇷🇷🇺🇿🇦🇳🇬🇰🇪🇵🇰🇧🇩🇱🇰🇳🇵🇮🇩🇲🇾🇹🇭🇻🇳🇵🇭🇸🇦🇶🇦🇹🇷🇪🇬🇲🇽🇦🇷🇨🇭🇳🇱🇸🇪🇳🇴" },
];

const RECENT_KEY = "fn_recent_emojis";
const splitEmoji = (set) => (typeof Intl !== "undefined" && Intl.Segmenter ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(set), (s) => s.segment) : Array.from(set));
const BUILT = CATEGORIES.map((c) => ({ ...c, list: splitEmoji(c.set).filter((e) => e.trim()) }));

const readRecent = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
};

export default function EmojiPicker({ onPick, disabled }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("smileys");
  const [recent, setRecent] = useState(readRecent);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const pick = (emoji) => {
    onPick(emoji);
    const next = [emoji, ...recent.filter((e) => e !== emoji)].slice(0, 24);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };

  const list = tab === "recent" ? recent : BUILT.find((c) => c.id === tab)?.list || [];

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="w-9 h-9 rounded-full text-[#0066FF] hover:bg-blue-500/10 flex items-center justify-center disabled:opacity-40"
        aria-label="Emoji"
        title="Emoji"
      >
        <Smile className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute bottom-11 left-0 z-50 w-[300px] max-w-[85vw] rounded-2xl bg-white dark:bg-[#161a24] border border-black/[0.08] dark:border-white/[0.12] shadow-[0_16px_48px_rgba(0,0,0,0.25)] overflow-hidden">
          <div className="flex items-center gap-0.5 px-1.5 py-1.5 border-b border-black/[0.06] dark:border-white/[0.08] overflow-x-auto">
            {recent.length > 0 && (
              <button type="button" onClick={() => setTab("recent")} title="Recent" className={`w-8 h-8 shrink-0 rounded-lg text-base ${tab === "recent" ? "bg-black/[0.08] dark:bg-white/[0.12]" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"}`}>
                🕘
              </button>
            )}
            {BUILT.map((c) => (
              <button key={c.id} type="button" onClick={() => setTab(c.id)} title={c.name} className={`w-8 h-8 shrink-0 rounded-lg text-base ${tab === c.id ? "bg-black/[0.08] dark:bg-white/[0.12]" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"}`}>
                {c.icon}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-0.5 p-2 h-[220px] overflow-y-auto content-start">
            {list.map((e, i) => (
              <button key={`${e}-${i}`} type="button" onClick={() => pick(e)} className="h-8 rounded-lg text-xl hover:bg-black/[0.06] dark:hover:bg-white/[0.1]">
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
