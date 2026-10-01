import { Fragment } from "react";

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;

function Inline({ text }) {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[0.85em] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function parseBlocks(source) {
  const blocks = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]);
      i += 1;
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    const heading = line.match(/^#{1,4}\s+(.*)/);
    if (heading) {
      blocks.push({ type: "heading", text: heading[1] });
      i += 1;
      continue;
    }

    const bullet = /^\s*[-*•]\s+/;
    const numbered = /^\s*\d+[.)]\s+/;
    const kind = bullet.test(line) ? "ul" : numbered.test(line) ? "ol" : null;
    if (kind) {
      const re = kind === "ul" ? bullet : numbered;
      const items = [];
      while (i < lines.length && re.test(lines[i])) items.push(lines[i++].replace(re, ""));
      blocks.push({ type: kind, items });
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !/^#{1,4}\s/.test(lines[i]) &&
      !bullet.test(lines[i]) &&
      !numbered.test(lines[i])
    ) {
      para.push(lines[i++]);
    }
    blocks.push({ type: "p", text: para.join("\n") });
  }
  return blocks;
}

export default function Markdown({ text }) {
  return (
    <div className="space-y-2 break-words">
      {parseBlocks(text).map((b, i) => {
        if (b.type === "code") {
          return (
            <pre key={i} className="p-2.5 rounded-xl bg-black/10 dark:bg-black/40 text-xs font-mono overflow-x-auto whitespace-pre">
              {b.text}
            </pre>
          );
        }
        if (b.type === "heading") {
          return <p key={i} className="font-bold"><Inline text={b.text} /></p>;
        }
        if (b.type === "ul" || b.type === "ol") {
          const List = b.type === "ul" ? "ul" : "ol";
          return (
            <List key={i} className={`${b.type === "ul" ? "list-disc" : "list-decimal"} pl-5 space-y-1`}>
              {b.items.map((item, j) => (
                <li key={j}><Inline text={item} /></li>
              ))}
            </List>
          );
        }
        return <p key={i} className="whitespace-pre-wrap"><Inline text={b.text} /></p>;
      })}
    </div>
  );
}
