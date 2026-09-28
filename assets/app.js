const KEY = "tradeJourneyTradesV1",
  SETKEY = "tradeJourneySettingsV1";
let trades = JSON.parse(localStorage.getItem(KEY) || "[]");
let settings = JSON.parse(localStorage.getItem(SETKEY) || "null") || {
  fields: [
    { key: "instrument", label: "Instrument", type: "text" },
    { key: "direction", label: "Direction", type: "select" },
    { key: "session", label: "Session", type: "select" },
    { key: "setup", label: "Setup", type: "text" },
    { key: "entry", label: "Entry", type: "number" },
    { key: "sl", label: "Stop Loss", type: "number" },
    { key: "tp", label: "Take Profit", type: "number" },
    { key: "risk", label: "Risk %", type: "number" },
    { key: "result", label: "Result", type: "select" },
    { key: "r", label: "R Multiple", type: "number" },
    { key: "reason", label: "Trade Reason / Analysis", type: "textarea" },
    { key: "lesson", label: "Lesson / Mistake", type: "textarea" },
  ],
  setups: [
    "FVG",
    "SMT",
    "Liquidity Sweep",
    "Order Block",
    "Breakout",
    "Pullback",
  ],
};
const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) =>
  `${Number(n || 0) >= 0 ? "+" : ""}${Number(n || 0).toFixed(2)}R`;
const save = () => localStorage.setItem(KEY, JSON.stringify(trades));
const THEME_PRESETS = {
  midnight: {
    bg: "#060b12",
    panel: "#0a1320",
    panel2: "#0e1a29",
    line: "#20344a",
    text: "#edf6ff",
    muted: "#8499b2",
    accent: "#2f8df4",
    sidebar: "#08111c",
    input: "#091521",
  },
  dark: {
    bg: "#080d13",
    panel: "#0d141d",
    panel2: "#111b27",
    line: "#1f2c3b",
    text: "#e9f0f8",
    muted: "#8190a4",
    accent: "#2f8df4",
    sidebar: "#091019",
    input: "#0b131d",
  },
  oled: {
    bg: "#000000",
    panel: "#050505",
    panel2: "#090909",
    line: "#242424",
    text: "#f5f5f5",
    muted: "#8f8f8f",
    accent: "#00cfff",
    sidebar: "#000000",
    input: "#050505",
  },
  light: {
    bg: "#f4f7fb",
    panel: "#ffffff",
    panel2: "#f7f9fc",
    line: "#d9e1ea",
    text: "#142033",
    muted: "#66758a",
    accent: "#2376e8",
    sidebar: "#ffffff",
    input: "#ffffff",
  },
};
function applyTheme() {
  const theme = settings.theme || "midnight";
  document.body.dataset.theme = theme;
  const base = THEME_PRESETS[theme] || THEME_PRESETS.midnight;
  const c = { ...base, ...(settings.colors || {}) };
  const root = document.documentElement;
  Object.entries(c).forEach(([k, v]) => {
    root.style.setProperty("--" + k, v);
    document.body.style.setProperty("--" + k, v);
  });
  root.style.setProperty("--accent", c.accent);
  root.style.setProperty("--blue", c.accent);
  document.body.style.setProperty("--accent", c.accent);
  document.body.style.setProperty("--blue", c.accent);
}
applyTheme();
function nav(page) {
  document
    .querySelectorAll(".page")
    .forEach((x) => x.classList.remove("active"));
  $(page).classList.add("active");
  document
    .querySelectorAll(".nav")
    .forEach((x) => x.classList.toggle("active", x.dataset.page === page));
  $("pageTitle").textContent = {
    dashboard: "Dashboard",
    add: "Add Trade",
    trades: "Past Trades",
    calendar: "Calendar",
    analytics: "Analytics",
    vault: "Chart Vault",
    customize: "Customize",
    settings: "Settings",
  }[page];
  render(page);
}
document
  .querySelectorAll(".nav")
  .forEach((b) => (b.onclick = () => nav(b.dataset.page)));
$("quickAdd").onclick = () => nav("add");

function render(page) {
  if (page === "dashboard") dashboard();
  if (page === "add") addTrade();
  if (page === "trades") pastTrades();
  if (page === "calendar") calendar();
  if (page === "analytics") analytics();
  if (page === "vault") vault();
  if (page === "customize") customize();
  if (page === "settings") settingsPage();
}
function dashboard() {
  const wins = trades.filter((t) => t.result === "win").length,
    loss = trades.filter((t) => t.result === "loss").length;
  const r = trades.reduce((a, t) => a + Number(t.r || 0), 0),
    wr = trades.length ? (wins / trades.length) * 100 : 0;
  $("dashboard").innerHTML = `
 <div class="grid4">
  <div class="card stat"><small>Total Trades</small><strong>${trades.length}</strong></div>
  <div class="card stat"><small>Net R</small><strong class="${r >= 0 ? "green" : "red"}">${money(r)}</strong></div>
  <div class="card stat"><small>Win Rate</small><strong>${wr.toFixed(1)}%</strong></div>
  <div class="card stat"><small>W / L</small><strong>${wins} / ${loss}</strong></div>
 </div>
 <div class="grid2">
  <div class="card"><div class="section-head"><h2>Recent Trades</h2><button class="ghost" onclick="nav('trades')">View all</button></div>
   ${recentRows(7)}
  </div>
  <div class="card"><div class="section-head"><h2>Quick Actions</h2></div>
   <div style="display:grid;gap:8px"><button class="primary" onclick="nav('add')">＋ Record New Trade</button><button class="ghost" onclick="nav('calendar')">▦ Open Calendar</button><button class="ghost" onclick="nav('analytics')">◔ View Analytics</button></div>
  </div>
 </div>`;
}
function recentRows(n) {
  if (!trades.length)
    return `<div class="empty">No trades yet.<br><br>Start by recording your first trade.</div>`;
  return `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Market</th><th>Setup</th><th>Result</th><th>R</th></tr></thead><tbody>${trades
    .slice(-n)
    .reverse()
    .map((t) => row(t))
    .join("")}</tbody></table></div>`;
}
function row(t) {
  return `<tr onclick="details('${t.id}')" style="cursor:pointer"><td>${new Date(t.date).toLocaleDateString()}</td><td>${esc(t.instrument)}</td><td>${esc(t.setup || "—")}</td><td><span class="pill ${t.result}">${String(t.result).toUpperCase()}</span></td><td class="${Number(t.r) >= 0 ? "green" : "red"}">${money(t.r)}</td></tr>`;
}

function addTrade(editId = null) {
  const t = editId ? trades.find((x) => x.id === editId) : null;
  const assets = [
    "XAUUSD",
    "NAS100",
    "GER40",
    "US30",
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "AUDUSD",
    "USDCAD",
    "EURJPY",
    "BTCUSD",
    "ETHUSD",
    "SILVER",
    "USOIL",
    "NIFTY50",
    "NIFTY100",
    "BANKNIFTY",
    "CUSTOM",
  ];
  const currentAsset = assets.includes(t?.instrument)
    ? t.instrument
    : t?.instrument
      ? "CUSTOM"
      : "XAUUSD";
  const customAsset = currentAsset === "CUSTOM" ? t?.instrument || "" : "";
  $("add").innerHTML = `<div class="card">
 <div class="section-head"><div><h2>${t ? "Edit Trade" : "Add Trade"}</h2><div class="muted">Record the setup, execution, screenshots and lesson.</div></div></div>
 <form id="tradeForm"><div class="formgrid">
  <div class="field"><label>Trade Date</label><div class="date-picker-row"><input id="tradeDate" type="date" value="${esc(localDatePart(t?.date))}" required><button type="button" class="today-btn" onclick="setToday()">Today</button></div></div>
  <div class="field"><label>Trade Time</label><input id="tradeTime" type="time" value="${esc(localTimePart(t?.date))}" required></div>
  <div class="field"><label>Asset</label><select id="asset">${assets.map((o) => `<option value="${o}" ${o === currentAsset ? "selected" : ""}>${o === "CUSTOM" ? "＋ Custom / Manual Asset" : o}</option>`).join("")}</select><input id="customAsset" class="custom-asset ${currentAsset === "CUSTOM" ? "show" : ""}" type="text" value="${esc(customAsset)}" placeholder="Type asset/pair manually, e.g. GBPJPY"></div>
  ${selectField("direction", "Direction", ["LONG", "SHORT"], t?.direction || "LONG")}
  ${selectField("session", "Session", ["London", "New York", "Asian", "Other"], t?.session || "London")}
  ${field("setup", "Setup", "text", t?.setup || "", "FVG + SMT + Liquidity")}
  ${field("entry", "Entry", "number", t?.entry || "")}
  ${field("sl", "Stop Loss", "number", t?.sl || "")}
  ${field("tp", "Take Profit", "number", t?.tp || "")}
  ${field("risk", "Risk %", "number", t?.risk || ".5")}
  ${selectField("result", "Result", ["win", "loss", "be"], t?.result || "win")}
  ${field("r", "R Multiple", "number", t?.r || "")}
  <div class="field"><label>Rule Break?</label><select id="rule"><option value="no">No</option><option value="yes" ${t?.rule === "yes" ? "selected" : ""}>Yes</option></select></div>
  ${field("reason", "Trade Reason / Analysis", "textarea", t?.reason || "", "Why did I take this trade?", "span2")}
  ${field("lesson", "Lesson / Mistake", "textarea", t?.lesson || "", "What will I do better next time?", "span2")}
 </div>
 <div class="card psychology-card" style="margin-top:12px"><div class="section-head"><div><h3>🧠 Psychology Tracker</h3><div class="muted">Capture your mental state before and after the trade.</div></div></div><div class="formgrid">${emotionField("emotionBefore", "Emotion Before Trade", t?.emotionBefore || "")}${emotionField("emotionAfter", "Emotion After Trade", t?.emotionAfter || "")} ${field("psychologyNote", "Psychology Note", "textarea", t?.psychologyNote || "", "What was going through my mind?", "span2")}</div></div>
 <div class="card chart-upload" style="margin-top:12px"><div class="section-head"><div><h3>Chart Screenshots <span class="optional-badge">Optional</span></h3><div class="muted">Screenshots are optional. Save the trade even if you don't upload any files.</div></div></div>
 <div class="shotinputs formgrid">
  <div class="field"><label>Before Entry</label><input id="img1" type="file" accept="image/*"><small class="file-note">Optional</small></div>
  <div class="field"><label>Entry</label><input id="img2" type="file" accept="image/*"><small class="file-note">Optional</small></div>
  <div class="field"><label>Exit</label><input id="img3" type="file" accept="image/*"><small class="file-note">Optional</small></div>
 </div></div>
 <div class="form-actions"><button class="primary">${t ? "Save Changes" : "💾 Save Trade"}</button><button type="button" class="ghost" onclick="nav('trades')">Cancel</button></div>
 </form></div>`;
  $("asset").onchange = () =>
    $("customAsset").classList.toggle("show", $("asset").value === "CUSTOM");
  $("tradeForm").onsubmit = async (e) => {
    e.preventDefault();
    await saveTradeForm(editId);
  };
}
function localDatePart(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  const y = d.getFullYear(),
    m = String(d.getMonth() + 1).padStart(2, "0"),
    day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function localTimePart(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime()))
    return `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function setToday() {
  const d = new Date();
  $("tradeDate").value =
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function field(id, label, type, value = "", ph = "", cls = "") {
  return `<div class="field ${cls}"><label>${label}</label>${type === "textarea" ? `<textarea id="${id}" placeholder="${ph}">${esc(value)}</textarea>` : `<input id="${id}" type="${type}" value="${esc(value)}" placeholder="${ph}">`}</div>`;
}
function selectField(id, label, opts, val) {
  return `<div class="field"><label>${label}</label><select id="${id}">${opts.map((o) => `<option value="${o}" ${o === val ? "selected" : ""}>${String(o).toUpperCase()}</option>`).join("")}</select></div>`;
}
const EMOTIONS = [
  "Calm",
  "Confident",
  "Focused",
  "Neutral",
  "Excited",
  "FOMO",
  "Anxious",
  "Fearful",
  "Revenge",
  "Impatient",
  "Greedy",
  "Tired",
  "Frustrated",
  "Overconfident",
];
function emotionField(id, label, val) {
  return `<div class="field"><label>${label}</label><select id="${id}"><option value="">Select emotion</option>${EMOTIONS.map((o) => `<option value="${o}" ${o === val ? "selected" : ""}>${o}</option>`).join("")}</select></div>`;
}
async function fileData(file) {
  return new Promise((ok, no) => {
    if (!file) return ok(null);
    const r = new FileReader();
    r.onload = () => ok(r.result);
    r.onerror = no;
    r.readAsDataURL(file);
  });
}
async function saveTradeForm(editId) {
  const old = editId ? trades.find((x) => x.id === editId) : null;
  const imgs = [
    await fileData($("img1").files[0]),
    await fileData($("img2").files[0]),
    await fileData($("img3").files[0]),
  ];
  const instrument =
    $("asset").value === "CUSTOM"
      ? $("customAsset").value.trim()
      : $("asset").value;
  const dateValue = $("tradeDate").value,
    timeValue = $("tradeTime").value;
  if (!dateValue) {
    alert("Please select a trade date from the calendar.");
    return;
  }
  const t = {
    id: editId || Date.now().toString(36),
    date: `${dateValue}T${timeValue || "00:00"}`,
    instrument,
    direction: $("direction").value,
    session: $("session").value,
    setup: $("setup").value.trim(),
    entry: $("entry").value,
    sl: $("sl").value,
    tp: $("tp").value,
    risk: $("risk").value,
    result: $("result").value,
    r: Number($("r").value || 0),
    rule: $("rule").value,
    reason: $("reason").value,
    lesson: $("lesson").value,
    emotionBefore: $("emotionBefore").value,
    emotionAfter: $("emotionAfter").value,
    psychologyNote: $("psychologyNote").value,
    images: imgs.map((x, i) => x || old?.images?.[i] || null),
  };
  if (!t.instrument) {
    alert("Please enter Instrument.");
    return;
  }
  if (editId) trades = trades.map((x) => (x.id === editId ? t : x));
  else trades.push(t);
  save();
  nav("trades");
}
function pastTrades() {
  $("trades").innerHTML =
    `<div class="card"><div class="section-head"><div><h2>Past Trades</h2><div class="muted">${trades.length} saved trades</div></div><button class="primary" onclick="nav('add')">＋ Add Trade</button></div>
 <div class="filters"><input class="search" id="tradeSearch" placeholder="Search market, setup or session..." oninput="filterTrades()"><select class="search" id="resultFilter" onchange="filterTrades()"><option value="">All Results</option><option value="win">Win</option><option value="loss">Loss</option><option value="be">Break-even</option></select></div>
 <div id="tradeTable">${recentRows(10000)}</div></div>`;
}
function filterTrades() {
  const q = $("tradeSearch").value.toLowerCase(),
    f = $("resultFilter").value;
  const a = trades.filter(
    (t) =>
      (!q ||
        `${t.instrument} ${t.setup} ${t.session}`.toLowerCase().includes(q)) &&
      (!f || t.result === f),
  );
  $("tradeTable").innerHTML = a.length
    ? `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Market</th><th>Direction</th><th>Setup</th><th>Result</th><th>R</th></tr></thead><tbody>${a
        .slice()
        .reverse()
        .map((t) => row(t))
        .join("")}</tbody></table></div>`
    : `<div class="empty">No matching trades.</div>`;
}
function details(id) {
  const t = trades.find((x) => x.id === id);
  if (!t) return;
  const emotionHTML =
    t.emotionBefore || t.emotionAfter || t.psychologyNote
      ? `<div class="card psychology-detail"><h3>🧠 Psychology</h3><div class="psych-grid"><div><small>Before</small><b>${esc(t.emotionBefore || "—")}</b></div><div><small>After</small><b>${esc(t.emotionAfter || "—")}</b></div></div><p>${esc(t.psychologyNote || "—")}</p></div>`
      : "";
  $("modalBody").innerHTML =
    `<h2>${esc(t.instrument)} · ${esc(t.direction)}</h2><div class="muted">${new Date(t.date).toLocaleString()} · ${esc(t.session)}</div>
 <div class="grid4" style="margin:15px 0">${[
   ["Setup", t.setup],
   ["Entry", t.entry],
   ["SL", t.sl],
   ["TP", t.tp],
   ["Risk", t.risk + "%"],
   ["Result", String(t.result).toUpperCase()],
   ["R", money(t.r)],
   ["Rule Break", t.rule],
 ]
   .map(
     (x) =>
       `<div class="card"><small class="muted">${esc(x[0])}</small><div style="margin-top:6px;font-weight:750">${esc(x[1])}</div></div>`,
   )
   .join("")}</div>
 <div class="grid2"><div class="card"><h3>Analysis</h3><p>${esc(t.reason || "—")}</p></div><div class="card"><h3>Lesson</h3><p>${esc(t.lesson || "—")}</p></div></div>
 ${emotionHTML}
 <h3 style="margin-top:16px">Charts</h3>${t.images?.some(Boolean) ? `<div class="gallery">${t.images.map((im, i) => (im ? `<div class="shot"><img src="${im}" onclick="zoomImage('${t.id}',${i})"><div>${["Before Entry", "Entry", "Exit"][i]}</div></div>` : "")).join("")}</div>` : `<div class="empty">No screenshots saved.</div>`}
 <div class="form-actions" style="margin-top:15px"><button class="primary" onclick="closeModal();navEdit('${t.id}')">✎ Edit Trade</button><button class="danger" onclick="deleteTrade('${t.id}')">Delete Trade</button></div>`;
  $("modal").classList.remove("hidden");
}
function navEdit(id) {
  nav("add");
  setTimeout(() => addTrade(id), 0);
}
function deleteTrade(id) {
  if (!confirm("Delete this trade permanently?")) return;
  trades = trades.filter((t) => t.id !== id);
  save();
  closeModal();
  nav("trades");
}
function zoomImage(id, i) {
  const t = trades.find((x) => x.id === id);
  if (t?.images?.[i])
    $("modalBody").innerHTML = `<img class="detail-img" src="${t.images[i]}">`;
}
function closeModal() {
  $("modal").classList.add("hidden");
}
$("modalClose").onclick = closeModal;
$("modal").onclick = (e) => {
  if (e.target.id === "modal") closeModal();
};

let calCursor = new Date();
function calendar() {
  $("calendar").innerHTML =
    `<div class="card"><div class="calendar-head"><div><h2>Trading Calendar</h2><div class="muted">Click a date to see its trades.</div></div><div><button class="ghost" onclick="moveMonth(-1)">‹</button><b id="calTitle" style="margin:0 10px"></b><button class="ghost" onclick="moveMonth(1)">›</button></div></div><div id="calGrid"></div><div id="calDay" style="margin-top:12px"></div></div>`;
  renderCalendar();
}
function moveMonth(n) {
  calCursor.setMonth(calCursor.getMonth() + n);
  renderCalendar();
}
function renderCalendar() {
  const y = calCursor.getFullYear(),
    m = calCursor.getMonth(),
    first = new Date(y, m, 1),
    days = new Date(y, m + 1, 0).getDate(),
    start = (first.getDay() + 6) % 7;
  $("calTitle").textContent = calCursor.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
  let h = `<div class="cal-grid">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((x) => `<div class="cal-name">${x}</div>`).join("")}`;
  for (let i = 0; i < start; i++) h += "<div></div>";
  for (let d = 1; d <= days; d++) {
    let ds = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      a = trades.filter((t) => (t.date || "").slice(0, 10) === ds),
      w = a.filter((t) => t.result === "win").length,
      l = a.filter((t) => t.result === "loss").length;
    h += `<div class="cal-day" onclick="dayTrades('${ds}')"><div class="num">${d}</div>${a.length ? `<div class="count">${a.length} trade · ${w}W ${l}L</div><div class="bar ${w >= l ? "win" : "loss"}"></div>` : ""}</div>`;
  }
  $("calGrid").innerHTML = h + "</div>";
}
function dayTrades(ds) {
  const a = trades.filter((t) => (t.date || "").slice(0, 10) === ds);
  $("calDay").innerHTML =
    `<div class="card"><h3>${ds}</h3>${a.length ? `<div class="table-wrap"><table class="table"><tbody>${a.map(row).join("")}</tbody></table></div>` : `<div class="empty">No trades on this day.</div>`}</div>`;
}

function analytics() {
  const total = trades.length;
  const w = trades.filter((t) => t.result === "win").length,
    l = trades.filter((t) => t.result === "loss").length,
    be = trades.filter((t) => t.result === "be").length;
  const r = trades.reduce((a, t) => a + Number(t.r || 0), 0),
    wr = total ? (w / total) * 100 : 0;
  const group = (key, labelFallback = "No Data") => {
    const out = {};
    trades.forEach((t) => {
      const k = (t[key] || labelFallback).toString().trim() || labelFallback;
      if (!out[k]) out[k] = { trades: 0, wins: 0, losses: 0, be: 0, r: 0 };
      out[k].trades++;
      out[k].r += Number(t.r || 0);
      if (t.result === "win") out[k].wins++;
      else if (t.result === "loss") out[k].losses++;
      else out[k].be++;
    });
    return Object.entries(out).sort((a, b) => b[1].r - a[1].r);
  };
  const strategy = group("setup"),
    asset = group("instrument"),
    session = group("session");
  const table = (title, items) =>
    `<div class="card analytics-table-card"><div class="section-head"><h3>${title}</h3><span class="muted">${items.length} groups</span></div>${items.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Group</th><th>Trades</th><th>Win %</th><th>Net R</th><th>Avg R</th></tr></thead><tbody>${items.map(([name, v]) => `<tr><td><b>${esc(name)}</b></td><td>${v.trades}</td><td>${((v.wins / v.trades) * 100).toFixed(1)}%</td><td class="${v.r >= 0 ? "green" : "red"}">${money(v.r)}</td><td class="${v.r / v.trades >= 0 ? "green" : "red"}">${money(v.r / v.trades)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Add trades to build this breakdown.</div>`}</div>`;
  const equity = [{ label: "Start", r: 0 }];
  let cum = 0;
  trades
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((t, i) => {
      cum += Number(t.r || 0);
      equity.push({ label: `${i + 1}`, r: cum });
    });
  const eqMin = Math.min(0, ...equity.map((x) => x.r)),
    eqMax = Math.max(0, ...equity.map((x) => x.r)),
    range = Math.max(1, eqMax - eqMin),
    wSvg = 820,
    hSvg = 260,
    pad = 28;
  const points = equity
    .map((p, i) => {
      const x =
        pad +
        (equity.length === 1
          ? 0
          : (i / (equity.length - 1)) * (wSvg - pad * 2));
      const y = pad + ((eqMax - p.r) / range) * (hSvg - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const equityHTML = total
    ? `<div class="equity-wrap"><svg viewBox="0 0 ${wSvg} ${hSvg}" preserveAspectRatio="none" class="equity-svg"><defs><linearGradient id="eqFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="var(--accent)" stop-opacity=".28"/><stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs><line x1="${pad}" y1="${pad + (eqMax / range) * (hSvg - pad * 2)}" x2="${wSvg - pad}" y2="${pad + (eqMax / range) * (hSvg - pad * 2)}" stroke="var(--line)"/><polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${points} ${wSvg - pad},${hSvg - pad} ${pad},${hSvg - pad}" fill="url(#eqFill)" stroke="none"/></svg><div class="equity-meta"><span>Start <b>0.00R</b></span><span>Current <b class="${r >= 0 ? "green" : "red"}">${money(r)}</b></span><span>Peak <b>${money(eqMax)}</b></span><span>Low <b>${money(eqMin)}</b></span></div></div>`
    : `<div class="empty">Add trades to see your cumulative R curve.</div>`;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    timeBlocks = ["00–06", "06–12", "12–18", "18–24"];
  const heat = {};
  days.forEach((d) =>
    timeBlocks.forEach((s) => (heat[`${d}|${s}`] = { r: 0, n: 0 })),
  );
  trades.forEach((t) => {
    const d = new Date(t.date),
      day = days[(d.getDay() + 6) % 7],
      h = d.getHours(),
      block = h < 6 ? "00–06" : h < 12 ? "06–12" : h < 18 ? "12–18" : "18–24",
      k = `${day}|${block}`;
    heat[k].r += Number(t.r || 0);
    heat[k].n++;
  });
  const vals = Object.values(heat).map((x) => x.r),
    maxAbs = Math.max(1, ...vals.map(Math.abs));
  const heatHTML = `<div class="heatmap"><div class="heat-corner"></div>${timeBlocks.map((s) => `<div class="heat-head">${s}</div>`).join("")}${days
    .map(
      (d) =>
        `<div class="heat-day">${d}</div>${timeBlocks
          .map((s) => {
            const v = heat[`${d}|${s}`],
              alpha = Math.min(0.75, (Math.abs(v.r) / maxAbs) * 0.75);
            return `<div class="heat-cell ${v.r > 0 ? "positive" : v.r < 0 ? "negative" : "flat"}" style="--heat-alpha:${alpha}"><b>${v.n ? v.r.toFixed(2) : "—"}${v.n ? "R" : ""}</b><small>${v.n ? `${v.n} trade${v.n > 1 ? "s" : ""}` : ""}</small></div>`;
          })
          .join("")}`,
    )
    .join("")}</div>`;
  const psychBefore = {},
    psychAfter = {};
  trades.forEach((t) => {
    if (t.emotionBefore)
      psychBefore[t.emotionBefore] = (psychBefore[t.emotionBefore] || 0) + 1;
    if (t.emotionAfter)
      psychAfter[t.emotionAfter] = (psychAfter[t.emotionAfter] || 0) + 1;
  });
  const psychList = Object.keys({ ...psychBefore, ...psychAfter });
  const psychHTML = psychList.length
    ? `<div class="psych-summary-grid">${psychList
        .sort((a, b) => (psychBefore[b] || 0) - (psychBefore[a] || 0))
        .map(
          (e) =>
            `<div class="psych-chip"><b>${esc(e)}</b><span>Before ${psychBefore[e] || 0} · After ${psychAfter[e] || 0}</span></div>`,
        )
        .join("")}</div>`
    : `<div class="empty">Add emotions to your trades to see psychology patterns.</div>`;
  $("analytics").innerHTML =
    `<div class="grid4"><div class="card stat"><small>Total Trades</small><strong>${total}</strong></div><div class="card stat"><small>Net R</small><strong class="${r >= 0 ? "green" : "red"}">${money(r)}</strong></div><div class="card stat"><small>Win Rate</small><strong>${wr.toFixed(1)}%</strong></div><div class="card stat"><small>W / L / BE</small><strong>${w} / ${l} / ${be}</strong></div></div>
 <div class="card analytics-section"><div class="section-head"><div><h2>📈 Equity Curve</h2><div class="muted">Cumulative R across your saved trades, ordered by trade time.</div></div></div>${equityHTML}</div>
 <div class="grid2 analytics-section">${table("🎯 Strategy-wise Performance", strategy)}${table("💱 Asset-wise Performance", asset)}</div>
 <div class="card analytics-section">${table("🕒 Session-wise Performance", session)}</div>
 <div class="card analytics-section"><div class="section-head"><div><h2>🔥 Trading Heatmap</h2><div class="muted">Net R grouped by weekday and trading session.</div></div></div>${heatHTML}<div class="heat-legend"><span><i class="pos"></i> Positive R</span><span><i class="neg"></i> Negative R</span><span><i class="flat"></i> No/flat result</span></div></div>
 <div class="card analytics-section"><div class="section-head"><div><h2>🧠 Psychology Tracker</h2><div class="muted">See which emotions appear before and after your trades.</div></div></div>${psychHTML}</div>`;
}
function vault() {
  const shots = [];
  trades.forEach((t) =>
    (t.images || []).forEach((im, i) => {
      if (im)
        shots.push({ im, label: ["Before Entry", "Entry", "Exit"][i], t });
    }),
  );
  $("vault").innerHTML =
    `<div class="card"><div class="section-head"><div><h2>Chart Vault</h2><div class="muted">${shots.length} saved screenshots</div></div></div>${shots.length ? `<div class="gallery">${shots.map((s) => `<div class="shot"><img src="${s.im}" onclick="details('${s.t.id}')"><div><b>${esc(s.t.instrument)}</b><br><span class="muted">${s.label} · ${new Date(s.t.date).toLocaleDateString()}</span></div></div>`).join("")}</div>` : `<div class="empty">Your saved trade charts will appear here.</div>`}</div>`;
}
function customize() {
  const c = {
    ...(THEME_PRESETS[settings.theme || "midnight"] || THEME_PRESETS.midnight),
    ...(settings.colors || {}),
  };
  const colorRows = [
    ["bg", "App Background", "Overall page background"],
    ["sidebar", "Sidebar", "Left navigation background"],
    ["panel", "Cards / Panels", "Main card background"],
    ["panel2", "Secondary Panels", "Buttons and secondary surfaces"],
    ["input", "Input Background", "Text fields and dropdowns"],
    ["line", "Borders", "Borders and dividers"],
    ["text", "Main Text", "Headings and primary text"],
    ["muted", "Muted Text", "Labels and secondary text"],
    ["accent", "Accent Color", "Buttons, active states and highlights"],
  ];
  const colorHTML = colorRows
    .map(
      ([key, label, desc]) =>
        `<div class="color-control"><div><b>${label}</b><small>${desc}</small></div><div class="color-pick"><input type="color" id="color_${key}" value="${c[key]}"><input class="hex-input" id="hex_${key}" value="${c[key]}" maxlength="7" aria-label="${label} hex value"></div></div>`,
    )
    .join("");
  $("customize").innerHTML = `
 <div class="card customize-appearance">
  <div class="section-head"><div><h2>🎨 Appearance & Colors</h2><div class="muted">Choose a preset or make every major color your own. Changes stay private in this browser.</div></div><button class="ghost" onclick="resetColors()">↺ Reset Colors</button></div>
  <div class="preset-grid">
   ${Object.entries(THEME_PRESETS)
     .map(
       ([id, v]) =>
         `<button class="preset-card ${settings.theme === id && !Object.keys(settings.colors || {}).length ? "selected" : ""}" onclick="setTheme('${id}')"><span class="preset-preview" style="--pbg:${v.bg};--ppanel:${v.panel};--paccent:${v.accent};--pline:${v.line}"><i></i><em></em></span><b>${id[0].toUpperCase() + id.slice(1)}</b><small>${id === "midnight" ? "Deep blue" : id === "dark" ? "Classic dark" : id === "oled" ? "True black" : "Bright & clean"}</small></button>`,
     )
     .join("")}
  </div>
  <div class="color-grid">${colorHTML}</div>
  <div class="form-actions"><button class="primary" onclick="saveColors()">💾 Save Colors</button><button class="ghost" onclick="previewColors()">👁 Preview</button></div>
 </div>
 <div class="grid2">
  <div class="card"><h2>Trade Fields</h2><div class="muted">These control the structure of your journal.</div><div id="fieldList" style="margin-top:12px">${settings.fields.map((f, i) => `<div class="custom-row"><input value="${esc(f.label)}" oninput="settings.fields[${i}].label=this.value"><select onchange="settings.fields[${i}].type=this.value"><option ${f.type === "text" ? "selected" : ""}>text</option><option ${f.type === "number" ? "selected" : ""}>number</option><option ${f.type === "textarea" ? "selected" : ""}>textarea</option><option ${f.type === "select" ? "selected" : ""}>select</option></select><button class="danger" onclick="settings.fields.splice(${i},1);customize()">×</button></div>`).join("")}</div><button class="ghost" onclick="settings.fields.push({key:'custom_'+Date.now(),label:'New Field',type:'text'});customize()">＋ Add Field</button></div>
  <div class="card"><h2>Setup Options</h2><div class="muted">Keep your setup vocabulary consistent.</div><div style="margin-top:12px">${settings.setups.map((x, i) => `<div class="setup-row"><input value="${esc(x)}" oninput="settings.setups[${i}]=this.value"><button class="danger" onclick="settings.setups.splice(${i},1);customize()">×</button></div>`).join("")}</div><button class="ghost" onclick="settings.setups.push('New Setup');customize()">＋ Add Setup</button></div>
 </div>
 <div style="margin-top:12px"><button class="primary" onclick="localStorage.setItem(SETKEY,JSON.stringify(settings));alert('Customization saved')">💾 Save Customization</button></div>`;
  colorRows.forEach(([key]) => {
    const picker = $("color_" + key),
      hex = $("hex_" + key);
    picker.oninput = () => {
      hex.value = picker.value;
      document.documentElement.style.setProperty("--" + key, picker.value);
      if (key === "accent")
        document.documentElement.style.setProperty("--blue", picker.value);
    };
    hex.oninput = () => {
      if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) {
        picker.value = hex.value;
        document.documentElement.style.setProperty("--" + key, hex.value);
        if (key === "accent")
          document.documentElement.style.setProperty("--blue", hex.value);
      }
    };
  });
}
function saveColors() {
  const keys = [
    "bg",
    "sidebar",
    "panel",
    "panel2",
    "input",
    "line",
    "text",
    "muted",
    "accent",
  ];
  settings.colors = {};
  keys.forEach((k) => {
    const v = $("hex_" + k)?.value;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) settings.colors[k] = v.toUpperCase();
  });
  localStorage.setItem(SETKEY, JSON.stringify(settings));
  applyTheme();
  customize();
}
function previewColors() {
  const keys = [
    "bg",
    "sidebar",
    "panel",
    "panel2",
    "input",
    "line",
    "text",
    "muted",
    "accent",
  ];
  settings.colors = {};
  keys.forEach((k) => {
    const v = $("hex_" + k)?.value;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) settings.colors[k] = v.toUpperCase();
  });
  applyTheme();
}
function resetColors() {
  settings.colors = {};
  localStorage.setItem(SETKEY, JSON.stringify(settings));
  applyTheme();
  customize();
}

function settingsPage() {
  const themes = [
    ["midnight", "Midnight", "Deep blue-black trading terminal"],
    ["dark", "Dark", "Classic dark workspace"],
    ["light", "Light", "Clean light workspace"],
    ["oled", "OLED", "Pure black, high-contrast mode"],
  ];
  $("settings").innerHTML =
    `<div class="grid2"><div class="card"><h2>Appearance</h2><p class="muted">Choose how Trade Journey looks. Your preference is saved locally.</p><div class="theme-options">${themes.map(([id, name, desc]) => `<button class="theme-option ${settings.theme === id ? "selected" : ""}" onclick="setTheme('${id}')"><span class="theme-swatch ${id}"></span><span><b>${name}</b><small>${desc}</small></span><span class="theme-check">${settings.theme === id ? "✓" : ""}</span></button>`).join("")}</div></div><div class="card"><h2>Private Storage</h2><p class="muted">Trade Journey stores your journal in this browser using local storage. No account or server is required for this version.</p><button class="primary" onclick="exportData()">Export Backup</button> <button class="ghost" onclick="importData()">Import Backup</button></div></div><div class="card" style="margin-top:12px"><h2>Danger Zone</h2><p class="muted">Delete all local trades after making a backup.</p><button class="danger" onclick="clearAll()">Delete All Trades</button></div>`;
}
function setTheme(theme) {
  settings.theme = theme;
  settings.colors = {};
  localStorage.setItem(SETKEY, JSON.stringify(settings));
  applyTheme();
  if (document.querySelector("#customize.active")) customize();
  if (document.querySelector("#settings.active")) settingsPage();
}
function exportData() {
  const blob = new Blob([JSON.stringify({ trades, settings }, null, 2)], {
      type: "application/json",
    }),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "trade-journey-backup.json";
  a.click();
}
function importData() {
  const i = document.createElement("input");
  i.type = "file";
  i.accept = ".json";
  i.onchange = async () => {
    const x = JSON.parse(await i.files[0].text());
    if (x.trades) trades = x.trades;
    if (x.settings) settings = x.settings;
    save();
    localStorage.setItem(SETKEY, JSON.stringify(settings));
    nav("dashboard");
  };
  i.click();
}
function clearAll() {
  if (
    confirm(
      "Delete all trades? This cannot be undone unless you have a backup.",
    )
  ) {
    trades = [];
    save();
    nav("dashboard");
  }
}
render("dashboard");

/* =========================
   Trade Journey V2.5 feature layer
   ========================= */

function v25Persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(trades));
  } catch (e) {}
}

function setupName(t) {
  return t.setup || "No Setup";
}

function strategyScorecard() {
  const map = {};
  trades.forEach((t) => {
    const k = setupName(t);
    if (!map[k]) map[k] = { trades: 0, w: 0, l: 0, be: 0, r: 0 };
    map[k].trades++;
    if (t.result === "win") map[k].w++;
    if (t.result === "loss") map[k].l++;
    if (t.result === "be") map[k].be++;
    map[k].r += Number(t.r || 0);
  });
  const rows = Object.entries(map).sort((a, b) => b[1].r - a[1].r);
  return rows.length
    ? rows
        .map(([k, v]) => {
          const wr = v.trades ? (v.w / v.trades) * 100 : 0;
          return `<div class="goal-card"><div style="display:flex;justify-content:space-between"><b>${esc(k)}</b><b class="${v.r >= 0 ? "green" : "red"}">${money(v.r)}</b></div>
      <div class="muted" style="margin-top:5px">${v.trades} trades · ${wr.toFixed(0)}% win · ${v.w}W / ${v.l}L / ${v.be}BE</div>
      <div class="scorebar"><i style="width:${Math.max(3, Math.min(100, wr))}%"></i></div></div>`;
        })
        .join("")
    : `<div class="empty">Add trades to build your Strategy Scorecard.</div>`;
}

function renderStrategyScorecard() {
  const panel = document.getElementById("strategyScorecard");
  if (panel) panel.innerHTML = strategyScorecard();
}

function applyPowerFilters() {
  const asset = document.getElementById("pfAsset")?.value || "";
  const session = document.getElementById("pfSession")?.value || "";
  const setup = document.getElementById("pfSetup")?.value || "";
  const result = document.getElementById("pfResult")?.value || "";
  const from = document.getElementById("pfFrom")?.value || "";
  const to = document.getElementById("pfTo")?.value || "";
  const q = document.getElementById("pfSearch")?.value.toLowerCase() || "";
  const a = trades.filter((t) => {
    const d = (t.date || "").slice(0, 10);
    return (
      (!asset || t.instrument === asset) &&
      (!session || t.session === session) &&
      (!setup || setupName(t) === setup) &&
      (!result || t.result === result) &&
      (!from || d >= from) &&
      (!to || d <= to) &&
      (!q ||
        `${t.instrument} ${t.setup} ${t.session}`.toLowerCase().includes(q))
    );
  });
  const out = document.getElementById("powerResults");
  if (out)
    out.innerHTML = a.length
      ? `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Asset</th><th>Session</th><th>Setup</th><th>Result</th><th>R</th></tr></thead><tbody>${a.slice().reverse().map(row).join("")}</tbody></table></div>`
      : `<div class="empty">No trades match these filters.</div>`;
}

function renderPowerFilters() {
  const el = document.getElementById("powerFilters");
  if (!el) return;
  const assets = [...new Set(trades.map((t) => t.instrument).filter(Boolean))];
  const sessions = [...new Set(trades.map((t) => t.session).filter(Boolean))];
  const setups = [...new Set(trades.map((t) => setupName(t)).filter(Boolean))];
  el.innerHTML = `<div class="filterbar">
    <input id="pfSearch" placeholder="Search..." oninput="applyPowerFilters()">
    <select id="pfAsset" onchange="applyPowerFilters()"><option value="">All Assets</option>${assets.map((x) => `<option>${esc(x)}</option>`).join("")}</select>
    <select id="pfSession" onchange="applyPowerFilters()"><option value="">All Sessions</option>${sessions.map((x) => `<option>${esc(x)}</option>`).join("")}</select>
    <select id="pfSetup" onchange="applyPowerFilters()"><option value="">All Setups</option>${setups.map((x) => `<option>${esc(x)}</option>`).join("")}</select>
    <select id="pfResult" onchange="applyPowerFilters()"><option value="">All Results</option><option value="win">Win</option><option value="loss">Loss</option><option value="be">BE</option></select>
    <input id="pfFrom" type="date" onchange="applyPowerFilters()"><input id="pfTo" type="date" onchange="applyPowerFilters()">
  </div><div id="powerResults"></div>`;
  applyPowerFilters();
}

function vaultV25() {
  const el = document.getElementById("vault");
  if (!el) return;
  const shots = [];
  trades.forEach((t) =>
    (t.images || []).forEach((im, i) => {
      if (im)
        shots.push({
          im,
          label: ["Before Entry", "Entry", "Exit"][i],
          t,
          index: i,
        });
    }),
  );
  el.innerHTML = `<div class="card"><div class="section-head"><div><h2>Chart Vault</h2><div class="muted">${shots.length} screenshots</div></div></div>
  <div class="vault-toolbar"><input id="vaultSearch" placeholder="Search asset / setup / tag..." oninput="filterVault()"><select id="vaultType" onchange="filterVault()"><option value="">All Chart Types</option><option>Before Entry</option><option>Entry</option><option>Exit</option></select></div>
  <div id="vaultGrid" class="gallery"></div></div>`;
  window._vaultShots = shots;
  filterVault();
}
function filterVault() {
  const q = document.getElementById("vaultSearch")?.value.toLowerCase() || "",
    typ = document.getElementById("vaultType")?.value || "";
  const a = (window._vaultShots || []).filter(
    (s) =>
      (!q ||
        `${s.t.instrument} ${s.t.setup} ${s.label}`
          .toLowerCase()
          .includes(q)) &&
      (!typ || s.label === typ),
  );
  const out = document.getElementById("vaultGrid");
  if (!out) return;
  out.innerHTML = a.length
    ? a
        .map(
          (s) =>
            `<div class="shot"><img src="${s.im}" onclick="openVaultImage('${s.t.id}',${s.index})"><div><b>${esc(s.t.instrument)}</b><br><span class="muted">${esc(s.label)} · ${new Date(s.t.date).toLocaleDateString()}</span></div></div>`,
        )
        .join("")
    : `<div class="empty">No screenshots match.</div>`;
}
function openVaultImage(id, i) {
  const t = trades.find((x) => x.id === id);
  if (!t?.images?.[i]) return;
  $("modalBody").innerHTML =
    `<div class="section-head"><h2>${esc(t.instrument)} · ${["Before Entry", "Entry", "Exit"][i]}</h2><button class="ghost" onclick="details('${id}')">Trade Details</button></div><img class="detail-img" src="${t.images[i]}">`;
  $("modal").classList.remove("hidden");
}

function computeStreak() {
  let cur = 0,
    best = 0;
  trades
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((t) => {
      if (t.result === "win") {
        cur++;
        best = Math.max(best, cur);
      } else cur = 0;
    });
  let current = 0;
  for (let i = trades.length - 1; i >= 0; i--) {
    if (trades[i].result === "win") current++;
    else break;
  }
  return { current, best };
}
function goalsPanel() {
  const g = JSON.parse(
    localStorage.getItem("tjGoalsV25") || '{"monthlyR":20,"monthlyTrades":40}',
  );
  const now = new Date(),
    ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const mt = trades.filter((t) => (t.date || "").slice(0, 7) === ym),
    r = mt.reduce((a, t) => a + Number(t.r || 0), 0),
    s = computeStreak();
  return `<div class="card"><div class="section-head"><div><h2>🏆 Goals & Streaks</h2><div class="muted">Current month: ${now.toLocaleString(undefined, { month: "long", year: "numeric" })}</div></div><button class="ghost" onclick="editGoals()">Set Goals</button></div>
 <div class="goal-grid"><div class="goal-card"><div class="muted">Monthly R</div><div class="streak">${r.toFixed(1)}R</div><div class="scorebar"><i style="width:${Math.min(100, Math.max(0, (r / g.monthlyR) * 100))}%"></i></div><small class="muted">Goal ${g.monthlyR}R</small></div>
 <div class="goal-card"><div class="muted">Monthly Trades</div><div class="streak">${mt.length}</div><div class="scorebar"><i style="width:${Math.min(100, (mt.length / g.monthlyTrades) * 100)}%"></i></div><small class="muted">Goal ${g.monthlyTrades}</small></div>
 <div class="goal-card"><div class="muted">Current Win Streak</div><div class="streak">${s.current} 🔥</div><small class="muted">Best: ${s.best}</small></div></div></div>`;
}
function editGoals() {
  const g = JSON.parse(
    localStorage.getItem("tjGoalsV25") || '{"monthlyR":20,"monthlyTrades":40}',
  );
  $("modalBody").innerHTML =
    `<h2>🏆 Trading Goals</h2><div class="formgrid"><div class="field"><label>Monthly R Goal</label><input id="goalR" type="number" value="${g.monthlyR}"></div><div class="field"><label>Monthly Trade Goal</label><input id="goalT" type="number" value="${g.monthlyTrades}"></div></div><div class="form-actions"><button class="primary" onclick="localStorage.setItem('tjGoalsV25',JSON.stringify({monthlyR:Number(goalR.value),monthlyTrades:Number(goalT.value)}));closeModal();render('dashboard')">Save Goals</button></div>`;
  $("modal").classList.remove("hidden");
}

function exportCSV() {
  const fields = [
    "date",
    "instrument",
    "direction",
    "session",
    "setup",
    "entry",
    "sl",
    "tp",
    "risk",
    "result",
    "r",
    "rule",
    "reason",
    "lesson",
    "emotionBefore",
    "emotionAfter",
    "psychologyNote",
  ];
  const lines = [fields.join(",")].concat(
    trades.map((t) =>
      fields
        .map((k) => `"${String(t[k] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  );
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "trade-journey-trades.csv";
  a.click();
}

function exportExcel() {
  // Excel-compatible CSV with .xls extension for broad compatibility without external libraries.
  const fields = [
    "date",
    "instrument",
    "direction",
    "session",
    "setup",
    "entry",
    "sl",
    "tp",
    "risk",
    "result",
    "r",
    "rule",
    "reason",
    "lesson",
    "emotionBefore",
    "emotionAfter",
    "psychologyNote",
  ];
  const rows = [
    fields,
    ...trades.map((t) => fields.map((k) => String(t[k] ?? ""))),
  ];
  const htmlTable =
    "<table>" +
    rows
      .map(
        (r) =>
          "<tr>" + r.map((c) => "<td>" + esc(c) + "</td>").join("") + "</tr>",
      )
      .join("") +
    "</table>";
  const blob = new Blob(
    [
      `<html><head><meta charset="utf-8"></head><body>${htmlTable}</body></html>`,
    ],
    { type: "application/vnd.ms-excel" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "trade-journey-export.xls";
  a.click();
}

function autoBackup() {
  try {
    localStorage.setItem(
      "tjAutoBackup",
      JSON.stringify({ at: Date.now(), trades, settings }),
    );
  } catch (e) {}
}
setInterval(autoBackup, 30000);
autoBackup();

function restoreAutoBackup() {
  const b = JSON.parse(localStorage.getItem("tjAutoBackup") || "null");
  if (!b?.trades) {
    alert("No automatic backup found.");
    return;
  }
  if (
    confirm(`Restore automatic backup from ${new Date(b.at).toLocaleString()}?`)
  ) {
    trades = b.trades;
    if (b.settings) settings = b.settings;
    save();
    localStorage.setItem(SETKEY, JSON.stringify(settings));
    nav("dashboard");
  }
}

function openQuick() {
  const p = document.getElementById("quickPanel");
  if (p) p.classList.remove("hidden");
}
function closeQuick() {
  const p = document.getElementById("quickPanel");
  if (p) p.classList.add("hidden");
}
function saveQuick() {
  const t = {
    id: Date.now().toString(36),
    date: new Date().toISOString().slice(0, 16),
    instrument: $("qAsset").value,
    direction: "LONG",
    session: "Other",
    setup: $("qSetup").value || "Quick Trade",
    entry: "",
    sl: "",
    tp: "",
    risk: "",
    result: $("qResult").value,
    r: Number($("qR").value || 0),
    rule: "no",
    reason: "",
    lesson: "",
    images: [],
  };
  trades.push(t);
  save();
  closeQuick();
  alert("Quick trade saved");
  render("dashboard");
}

function exportBackupV25() {
  const blob = new Blob(
      [
        JSON.stringify(
          {
            version: "2.5",
            trades,
            settings,
            goals: localStorage.getItem("tjGoalsV25"),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "trade-journey-full-backup.json";
  a.click();
}
function restoreBackupV25() {
  const i = document.createElement("input");
  i.type = "file";
  i.accept = ".json";
  i.onchange = async () => {
    try {
      const x = JSON.parse(await i.files[0].text());
      if (x.trades) trades = x.trades;
      if (x.settings) settings = x.settings;
      if (x.goals) localStorage.setItem("tjGoalsV25", x.goals);
      save();
      localStorage.setItem(SETKEY, JSON.stringify(settings));
      alert("Backup restored");
      nav("dashboard");
    } catch (e) {
      alert("Invalid backup file");
    }
  };
  i.click();
}

/* Replace/augment page renderers */
const _render = window.render;
window.render = function (page) {
  _render(page);
  if (page === "analytics") {
    const a = document.getElementById("analytics");
    if (a && !document.getElementById("strategyScorecard")) {
      a.innerHTML += `<div class="card" style="margin-top:12px"><div class="section-head"><h2>🎯 Strategy Scorecard</h2><span class="muted">Setup-level performance</span></div><div id="strategyScorecard" class="goal-grid"></div></div>`;
      renderStrategyScorecard();
    }
  }
  if (page === "trades") {
    const t = document.getElementById("trades");
    if (t && !document.getElementById("powerFilters")) {
      t.innerHTML += `<div class="card" style="margin-top:12px"><div class="section-head"><h2>🔎 Powerful Filters</h2><span class="muted">Asset · Session · Setup · Result · Date</span></div><div id="powerFilters"></div></div>`;
      renderPowerFilters();
    }
  }
  if (page === "vault") vaultV25();
  if (page === "dashboard") {
    const d = document.getElementById("dashboard");
    if (d && !document.getElementById("goalsV25"))
      d.innerHTML += `<div id="goalsV25" style="margin-top:12px">${goalsPanel()}</div>`;
  }
  if (page === "settings") {
    const s = document.getElementById("settings");
    if (s && !document.getElementById("v25Export")) {
      s.innerHTML += `<div class="card" style="margin-top:12px"><h2>💾 Backup & Export</h2><div class="muted" style="margin-bottom:10px">Automatic local backup runs every 30 seconds. You can also create or restore a full backup.</div><button class="primary" id="v25Export">Full Backup</button> <button class="ghost" id="v25Restore">Restore Backup</button> <button class="ghost" onclick="restoreAutoBackup()">Restore Auto Backup</button><div style="margin-top:10px"><button class="ghost" onclick="exportCSV()">📤 Export CSV</button> <button class="ghost" onclick="exportExcel()">📊 Export Excel</button></div></div>`;
      document.getElementById("v25Export").onclick = exportBackupV25;
      document.getElementById("v25Restore").onclick = restoreBackupV25;
    }
  }
};

/* Mobile sidebar + quick add */
document.addEventListener("DOMContentLoaded", () => {
  const mm = document.getElementById("mobileMenu");
  if (mm)
    mm.onclick = () =>
      document.querySelector(".sidebar")?.classList.toggle("mobile-open");
  const qa = document.getElementById("quickAddTrade");
  if (qa) qa.onclick = openQuick;
  const qc = document.getElementById("quickClose");
  if (qc) qc.onclick = closeQuick;
  const qs = document.getElementById("qSave");
  if (qs) qs.onclick = saveQuick;
});

/* Re-render after initial render if function order matters */
setTimeout(() => {
  render("dashboard");
}, 0);
