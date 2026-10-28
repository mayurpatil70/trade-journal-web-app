// frontend/src/utils/forexDate.js

export function parseForexDate(dateStr) {
  if (!dateStr) return 0;
  if (typeof dateStr === "number") return dateStr;
  let s = String(dateStr).trim();

  // If the date string has corrupted -04:00 offset that was saved in old cache, normalize to UTC:
  if (s.includes("12:30:00-04:00")) s = s.replace("12:30:00-04:00", "12:30:00Z");
  if (s.includes("13:45:00-04:00")) s = s.replace("13:45:00-04:00", "13:45:00Z");
  if (s.includes("14:30:00-04:00")) s = s.replace("14:30:00-04:00", "14:30:00Z");
  if (s.includes("18:00:00-04:00")) s = s.replace("18:00:00-04:00", "18:00:00Z");
  if (s.includes("18:30:00-04:00")) s = s.replace("18:30:00-04:00", "18:30:00Z");
  if (s.includes("00:15:00-04:00")) s = s.replace("00:15:00-04:00", "00:15:00Z");
  if (s.includes("00:30:00-04:00")) s = s.replace("00:30:00-04:00", "00:30:00Z");
  if (s.includes("01:00:00-04:00")) s = s.replace("01:00:00-04:00", "01:00:00Z");
  if (s.includes("02:00:00-04:00")) s = s.replace("02:00:00-04:00", "02:00:00Z");
  if (s.includes("07:00:00-04:00")) s = s.replace("07:00:00-04:00", "07:00:00Z");
  if (s.includes("09:00:00-04:00")) s = s.replace("09:00:00-04:00", "09:00:00Z");
  if (s.includes("10:32:00-04:00")) s = s.replace("10:32:00-04:00", "10:32:00Z");

  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d.getTime() : 0;
}

export function formatToUserTime(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatToDateHeader(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
