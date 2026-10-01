import api from "../../api/axios";

/**
 * POSTs to the SSE chat endpoint and calls onEvent for each parsed event.
 * (axios can't stream in the browser, so this uses fetch.)
 */
export async function streamChat({ message, history, userId, regenerate, signal, onEvent }) {
  const res = await fetch(`${api.defaults.baseURL}/api/ai/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
    credentials: "include",
    body: JSON.stringify({ message, history, userId, regenerate }),
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const line = block.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      let event;
      try {
        event = JSON.parse(line.slice(6));
      } catch {
        continue;
      }
      onEvent(event);
    }
  }
}
