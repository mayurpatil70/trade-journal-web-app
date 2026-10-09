import { useEffect, useRef, useState } from 'react';
import { Lock, Unlock, EyeOff, Copy, Trash2, BookmarkPlus, X, Check } from 'lucide-react';
import { TOOLS, MARKERS, saveTemplate } from './tools';

const LINE = new Set(['trendline', 'ray', 'extended', 'hline', 'vline', 'channel', 'rect', 'ellipse', 'triangle', 'arrow', 'fib', 'fibext', 'fibtime', 'pitchfork', 'brush', 'highlighter']);
const FILL = new Set(['channel', 'rect', 'ellipse', 'triangle', 'fib', 'fibext', 'pitchfork']);
const OPACITY = new Set([...FILL, 'highlighter', 'measure']);
const EXTEND = new Set(['trendline', 'channel', 'rect', 'fib', 'fibext']);
const TEXT = new Set(['text', 'callout', 'pricelabel', 'hline', 'vline', 'rect', 'marker']);
const FONT = new Set(['text', 'callout']);
const LABEL = new Set(['hline', 'vline', 'fib', 'fibext', 'fibtime']);
const COLOR_LESS = new Set(['marker', 'long', 'short', 'rr']);

const Row = ({ label, children }) => (
  <label className="flex items-center justify-between gap-3 py-1">
    <span className="text-[#787B86]">{label}</span>
    {children}
  </label>
);

const field = 'bg-[#0A0B0D] border border-[#222429] rounded px-1.5 py-1 text-[#D1D4DC] outline-none focus:border-[#2962FF]';

export default function DrawingSettings({ drawings, focusText, onFocused, onStyle, onPatch, onDelete, onDuplicate, onClose }) {
  const d = drawings[0];
  const s = d.style;
  const single = drawings.length === 1;
  const textRef = useRef(null);
  const [levels, setLevels] = useState(() => s.levels?.join(', ') ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (focusText === d.id && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
      onFocused();
    }
  }, [focusText, d.id, onFocused]);

  const allLocked = drawings.every((x) => x.locked);
  const title = single ? (d.type === 'marker' ? `${MARKERS[s.kind]?.label} marker` : TOOLS[d.type].label) : `${drawings.length} drawings`;

  const iconBtn = 'p-1.5 rounded hover:bg-[#1F2128] text-[#787B86] hover:text-[#D1D4DC]';

  return (
    <div className="absolute z-40 top-14 right-16 w-[232px] max-h-[calc(100%-5rem)] overflow-y-auto bg-[#16181D]/95 backdrop-blur border border-[#2B2D33] rounded-lg shadow-2xl text-[11px] text-[#D1D4DC]" onKeyDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#222429]">
        <span className="font-semibold truncate">{title}</span>
        <div className="flex items-center">
          <button title={allLocked ? 'Unlock' : 'Lock'} onClick={() => onPatch({ locked: !allLocked })} className={`${iconBtn} ${allLocked ? 'text-amber-400' : ''}`}>
            {allLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button title="Hide" onClick={() => onPatch({ hidden: true })} className={iconBtn}><EyeOff className="w-3.5 h-3.5" /></button>
          <button title="Duplicate (Ctrl+D)" onClick={onDuplicate} className={iconBtn}><Copy className="w-3.5 h-3.5" /></button>
          {single && (
            <button
              title="Save style as default for this tool"
              onClick={() => {
                saveTemplate(d.type, s);
                setSaved(true);
                setTimeout(() => setSaved(false), 1500);
              }}
              className={iconBtn}
            >
              {saved ? <Check className="w-3.5 h-3.5 text-[#089981]" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
            </button>
          )}
          <button title="Delete (Del)" onClick={onDelete} className={`${iconBtn} hover:text-[#F23645]`}><Trash2 className="w-3.5 h-3.5" /></button>
          <button title="Close" onClick={onClose} className={iconBtn}><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {single && (
        <div className="px-3 py-2 space-y-0.5">
          {d.type === 'marker' && (
            <Row label="Marker">
              <select value={s.kind} onChange={(e) => onStyle({ kind: e.target.value })} className={field}>
                {Object.entries(MARKERS).map(([k, m]) => <option key={k} value={k}>{m.glyph} {m.label}</option>)}
              </select>
            </Row>
          )}
          {!COLOR_LESS.has(d.type) && (
            <Row label="Color">
              <input type="color" value={s.color} onChange={(e) => onStyle({ color: e.target.value })} className="w-8 h-6 bg-transparent cursor-pointer" />
            </Row>
          )}
          {LINE.has(d.type) && (
            <>
              <Row label="Thickness">
                <select value={s.width} onChange={(e) => onStyle({ width: Number(e.target.value) })} className={field}>
                  {(d.type === 'highlighter' ? [8, 14, 20, 28] : [1, 2, 3, 4]).map((w) => <option key={w} value={w}>{w}px</option>)}
                </select>
              </Row>
              {d.type !== 'brush' && d.type !== 'highlighter' && (
                <Row label="Line style">
                  <select value={s.dash} onChange={(e) => onStyle({ dash: e.target.value })} className={field}>
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </Row>
              )}
            </>
          )}
          {FILL.has(d.type) && (
            <Row label="Background">
              <input type="checkbox" checked={!!s.fill} onChange={(e) => onStyle({ fill: e.target.checked })} />
            </Row>
          )}
          {OPACITY.has(d.type) && (
            <Row label="Opacity">
              <input type="range" min="0.02" max="0.8" step="0.02" value={s.opacity} onChange={(e) => onStyle({ opacity: Number(e.target.value) })} className="w-24" />
            </Row>
          )}
          {EXTEND.has(d.type) && (
            <>
              <Row label="Extend left"><input type="checkbox" checked={!!s.extendL} onChange={(e) => onStyle({ extendL: e.target.checked })} /></Row>
              <Row label="Extend right"><input type="checkbox" checked={!!s.extendR} onChange={(e) => onStyle({ extendR: e.target.checked })} /></Row>
            </>
          )}
          {d.type === 'arrow' && (
            <>
              <Row label="Arrow at start"><input type="checkbox" checked={!!s.arrowStart} onChange={(e) => onStyle({ arrowStart: e.target.checked })} /></Row>
              <Row label="Arrow at end"><input type="checkbox" checked={!!s.arrowEnd} onChange={(e) => onStyle({ arrowEnd: e.target.checked })} /></Row>
            </>
          )}
          {LABEL.has(d.type) && (
            <Row label={d.type === 'hline' ? 'Show price' : d.type === 'vline' ? 'Show time' : 'Show labels'}>
              <input type="checkbox" checked={!!s.showLabel} onChange={(e) => onStyle({ showLabel: e.target.checked })} />
            </Row>
          )}
          {s.levels && (
            <div className="py-1">
              <div className="text-[#787B86] mb-1">Levels (comma separated)</div>
              <input
                value={levels}
                onChange={(e) => setLevels(e.target.value)}
                onBlur={() => {
                  const parsed = levels.split(',').map((x) => parseFloat(x)).filter(Number.isFinite);
                  if (parsed.length) onStyle({ levels: [...new Set(parsed)] });
                }}
                className={`${field} w-full font-mono`}
              />
            </div>
          )}
          {TEXT.has(d.type) && (
            <div className="py-1">
              <div className="text-[#787B86] mb-1">{d.type === 'text' || d.type === 'callout' ? 'Text' : 'Label'}</div>
              <textarea ref={textRef} rows={d.type === 'text' || d.type === 'callout' ? 3 : 1} value={s.text || ''} onChange={(e) => onStyle({ text: e.target.value })} className={`${field} w-full resize-y`} />
            </div>
          )}
          {FONT.has(d.type) && (
            <>
              <Row label="Font size">
                <select value={s.fontSize} onChange={(e) => onStyle({ fontSize: Number(e.target.value) })} className={field}>
                  {[10, 12, 13, 14, 16, 20, 24, 32].map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Row>
              <div className="flex gap-1 py-1">
                <button onClick={() => onStyle({ bold: !s.bold })} className={`flex-1 py-1 rounded font-bold ${s.bold ? 'bg-[#2962FF] text-white' : 'bg-[#0A0B0D]'}`}>B</button>
                <button onClick={() => onStyle({ italic: !s.italic })} className={`flex-1 py-1 rounded italic ${s.italic ? 'bg-[#2962FF] text-white' : 'bg-[#0A0B0D]'}`}>I</button>
                {d.type === 'text' && ['left', 'center', 'right'].map((a) => (
                  <button key={a} onClick={() => onStyle({ align: a })} className={`flex-1 py-1 rounded capitalize ${s.align === a ? 'bg-[#2962FF] text-white' : 'bg-[#0A0B0D]'}`}>{a[0]}</button>
                ))}
              </div>
            </>
          )}
          {d.type === 'measure' && (
            <div className="py-1">
              <div className="text-[#787B86] mb-1">R:R note (optional)</div>
              <input value={s.rr || ''} onChange={(e) => onStyle({ rr: e.target.value })} placeholder="e.g. 1:3" className={`${field} w-full`} />
            </div>
          )}
          {d.locked && <p className="text-amber-400 pt-1">Locked: unlock to move or resize.</p>}
        </div>
      )}
    </div>
  );
}
