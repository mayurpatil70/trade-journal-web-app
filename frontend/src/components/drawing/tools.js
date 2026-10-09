import {
  MousePointer2, TrendingUp, MoveUpRight, MoveDiagonal, Minus, SeparatorVertical, Columns2, Square, Circle,
  Triangle, ArrowUpRight, Type, Tag, MessageSquare, Percent, Waypoints, GitFork, Ruler, TrendingDown, ArrowUpDown,
  Brush, Highlighter, MapPin, Rows3,
} from 'lucide-react';

export const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
export const FIB_EXT_LEVELS = [0, 0.618, 1, 1.272, 1.618, 2, 2.618];

export const MARKERS = {
  buy: { label: 'Buy', glyph: '▲', color: '#089981' },
  sell: { label: 'Sell', glyph: '▼', color: '#F23645' },
  entry: { label: 'Entry', glyph: 'E', color: '#2962FF' },
  exit: { label: 'Exit', glyph: 'X', color: '#9C27B0' },
  sl: { label: 'Stop Loss', glyph: 'SL', color: '#F23645' },
  tp: { label: 'Take Profit', glyph: 'TP', color: '#089981' },
  warning: { label: 'Warning', glyph: '⚠', color: '#F59E0B' },
  important: { label: 'Important', glyph: '!', color: '#F97316' },
  flag: { label: 'Flag', glyph: '⚑', color: '#E11D48' },
  star: { label: 'Star', glyph: '★', color: '#EAB308' },
};

// n = anchor clicks needed to create; 0 = freehand
export const TOOLS = {
  trendline: { label: 'Trend Line', icon: TrendingUp, n: 2 },
  ray: { label: 'Ray', icon: MoveUpRight, n: 2 },
  extended: { label: 'Extended Line', icon: MoveDiagonal, n: 2 },
  hline: { label: 'Horizontal Line', icon: Minus, n: 1 },
  vline: { label: 'Vertical Line', icon: SeparatorVertical, n: 1 },
  channel: { label: 'Parallel Channel', icon: Columns2, n: 3 },
  rect: { label: 'Rectangle', icon: Square, n: 2 },
  ellipse: { label: 'Circle / Ellipse', icon: Circle, n: 2 },
  triangle: { label: 'Triangle', icon: Triangle, n: 3 },
  arrow: { label: 'Arrow', icon: ArrowUpRight, n: 2 },
  text: { label: 'Text', icon: Type, n: 1 },
  pricelabel: { label: 'Price Label', icon: Tag, n: 1 },
  callout: { label: 'Callout / Note', icon: MessageSquare, n: 2 },
  fib: { label: 'Fib Retracement', icon: Percent, n: 2 },
  fibext: { label: 'Fib Extension', icon: Waypoints, n: 3 },
  fibtime: { label: 'Fib Time Zones', icon: Rows3, n: 2 },
  pitchfork: { label: 'Pitchfork', icon: GitFork, n: 3 },
  measure: { label: 'Measure', icon: Ruler, n: 2 },
  long: { label: 'Long Position', icon: TrendingUp, n: 1 },
  short: { label: 'Short Position', icon: TrendingDown, n: 1 },
  rr: { label: 'Risk/Reward', icon: ArrowUpDown, n: 3 },
  brush: { label: 'Brush', icon: Brush, n: 0 },
  highlighter: { label: 'Highlighter', icon: Highlighter, n: 0 },
  marker: { label: 'Marker', icon: MapPin, n: 1 },
};

export const GROUPS = [
  { id: 'cursor', label: 'Cursor', icon: MousePointer2, tools: [] },
  { id: 'lines', label: 'Lines', tools: ['trendline', 'ray', 'extended', 'hline', 'vline', 'arrow'] },
  { id: 'channels', label: 'Channels', tools: ['channel', 'pitchfork'] },
  { id: 'shapes', label: 'Shapes', tools: ['rect', 'ellipse', 'triangle', 'brush', 'highlighter'] },
  { id: 'fib', label: 'Fibonacci', tools: ['fib', 'fibext', 'fibtime'] },
  { id: 'annotation', label: 'Annotation', tools: ['text', 'pricelabel', 'callout'] },
  { id: 'risk', label: 'Measure & Risk', tools: ['long', 'short', 'rr', 'measure'] },
  { id: 'markers', label: 'Markers', tools: Object.keys(MARKERS).map((k) => `marker:${k}`) },
];

const BASE = { color: '#2962FF', width: 2, dash: 'solid', opacity: 0.2, fill: false, extendL: false, extendR: false, showLabel: true, fontSize: 14 };

export const DEFAULT_STYLES = {
  hline: { color: '#F59E0B', width: 1, text: '' },
  vline: { color: '#787B86', width: 1, text: '' },
  channel: { fill: true, opacity: 0.12 },
  rect: { color: '#9C27B0', fill: true, opacity: 0.15, width: 1 },
  ellipse: { color: '#00BCD4', fill: true, opacity: 0.12, width: 1 },
  triangle: { color: '#FF9800', fill: true, opacity: 0.12, width: 1 },
  arrow: { arrowStart: false, arrowEnd: true },
  text: { color: '#D1D4DC', text: 'Text', bold: false, italic: false, align: 'left' },
  pricelabel: { color: '#2962FF', text: '' },
  callout: { color: '#2962FF', text: 'Note', fontSize: 13 },
  fib: { color: '#787B86', width: 1, levels: FIB_LEVELS, fill: true, opacity: 0.06 },
  fibext: { color: '#787B86', width: 1, levels: FIB_EXT_LEVELS, fill: true, opacity: 0.06 },
  fibtime: { color: '#787B86', width: 1 },
  pitchfork: { color: '#E91E63', width: 1 },
  measure: { color: '#2962FF', opacity: 0.15 },
  brush: { color: '#D1D4DC', width: 2 },
  highlighter: { color: '#FFEB3B', width: 14, opacity: 0.35 },
  marker: { kind: 'buy', fontSize: 12 },
};

const TEMPLATE_KEY = 'drawing_templates';
export const loadTemplates = () => {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || '{}');
  } catch {
    return {};
  }
};
export const saveTemplate = (type, style) => {
  const all = loadTemplates();
  const rest = { ...style };
  delete rest.text;
  delete rest.kind;
  all[type] = rest;
  try {
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(all));
  } catch { /* storage full or blocked */ }
};

export const styleFor = (type) => ({ ...BASE, ...DEFAULT_STYLES[type], ...loadTemplates()[type] });

export const parseTool = (tool) => {
  const [type, kind] = tool.split(':');
  return { type, kind };
};

export const uid = () => Math.random().toString(36).slice(2, 10);
