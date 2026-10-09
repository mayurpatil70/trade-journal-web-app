import { useEffect, useRef, useState } from 'react';
import { MousePointer2, Undo2, Redo2, Lock, Unlock, Eye, EyeOff, Trash2 } from 'lucide-react';
import { GROUPS, TOOLS, MARKERS, parseTool } from './tools';

const toolMeta = (tool) => {
  const { type, kind } = parseTool(tool);
  if (type === 'marker') return { label: MARKERS[kind].label, glyph: MARKERS[kind].glyph, color: MARKERS[kind].color };
  return TOOLS[type];
};

const ToolIcon = ({ tool, className }) => {
  const m = toolMeta(tool);
  if (m.glyph) return <span className={`inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold ${className || ''}`} style={{ color: m.color }}>{m.glyph}</span>;
  const Icon = m.icon;
  return <Icon className={`w-4 h-4 ${className || ''}`} />;
};

export default function DrawingToolbar({ tool, setTool, undo, redo, canUndo, canRedo, hidden, toggleHidden, locked, toggleLocked, clearAll, count }) {
  const [open, setOpen] = useState(null);
  const [last, setLast] = useState(() => Object.fromEntries(GROUPS.filter((g) => g.tools.length).map((g) => [g.id, g.tools[0]])));
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(null);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  const btn = (active) => `relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${active ? 'text-[#2962FF] bg-[#2962FF]/15' : 'text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#1B1C20]'}`;

  return (
    <div ref={ref} className="h-full w-11 bg-[#101216] border-r border-[#1B1C20] flex flex-col items-center py-2 gap-1 overflow-y-auto overflow-x-visible">
      {GROUPS.map((g) => {
        if (!g.tools.length) {
          return (
            <button key={g.id} title="Cursor (Esc)" onClick={() => setTool('cursor')} className={btn(tool === 'cursor')}>
              <MousePointer2 className="w-4 h-4" />
            </button>
          );
        }
        const current = g.tools.includes(tool) ? tool : last[g.id];
        return (
          <div key={g.id} className="relative">
            <button title={g.label} onClick={() => setOpen(open === g.id ? null : g.id)} className={btn(g.tools.includes(tool))}>
              <ToolIcon tool={current} />
              <span className="absolute right-0.5 bottom-0.5 border-[3px] border-transparent border-r-current border-b-current opacity-60" />
            </button>
            {open === g.id && (
              <div className="fixed z-[200] ml-11 -mt-9 min-w-[190px] bg-[#16181D] border border-[#2B2D33] rounded-lg shadow-2xl py-1 text-xs">
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-[#5D606B]">{g.label}</div>
                {g.tools.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTool(t);
                      setLast((l) => ({ ...l, [g.id]: t }));
                      setOpen(null);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#1F2128] ${tool === t ? 'text-[#2962FF]' : 'text-[#D1D4DC]'}`}
                  >
                    <ToolIcon tool={t} />
                    {toolMeta(t).label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="h-px w-6 bg-[#222429] my-1 shrink-0" />
      <button title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo} className={`${btn(false)} disabled:opacity-30`}><Undo2 className="w-4 h-4" /></button>
      <button title="Redo (Ctrl+Y)" disabled={!canRedo} onClick={redo} className={`${btn(false)} disabled:opacity-30`}><Redo2 className="w-4 h-4" /></button>
      <button title={locked ? 'Unlock all drawings' : 'Lock all drawings'} onClick={toggleLocked} className={btn(locked)}>
        {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
      </button>
      <button title={hidden ? 'Show drawings' : 'Hide drawings'} onClick={toggleHidden} className={btn(hidden)}>
        {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      <button
        title="Remove all drawings"
        disabled={!count}
        onClick={() => window.confirm(`Delete all ${count} drawings on this symbol?`) && clearAll()}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-[#787B86] hover:text-[#F23645] hover:bg-[#1B1C20] disabled:opacity-30"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
