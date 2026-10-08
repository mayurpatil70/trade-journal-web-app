import { useState } from "react";
import { MousePointer2, TrendingUp, Minus, Search, Trash2, Edit3, Type, ArrowUpRight, Lock, Eye } from "lucide-react";

export default function DrawingToolbar() {
  const [activeTool, setActiveTool] = useState("cursor");
  const [isLocked, setIsLocked] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const tools = [
    { id: "cursor", icon: MousePointer2, label: "Cursor" },
    { id: "trendline", icon: TrendingUp, label: "Trend Line" },
    { id: "horizontal", icon: Minus, label: "Horizontal Line" },
    { id: "arrow", icon: ArrowUpRight, label: "Arrow" },
    { id: "brush", icon: Edit3, label: "Brush" },
    { id: "text", icon: Type, label: "Text" },
    { id: "zoom", icon: Search, label: "Zoom" },
  ];

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-[#131418] border border-[#222429] rounded-lg p-1.5 flex flex-col gap-1 shadow-lg">
      {tools.map((t) => (
        <button
          key={t.id}
          title={t.label}
          onClick={() => setActiveTool(t.id)}
          className={`p-2 rounded hover:bg-[#1B1C20] transition-colors ${activeTool === t.id ? "text-[#2962FF] bg-[#2962FF]/10" : "text-[#787B86] hover:text-[#D1D4DC]"}`}
        >
          <t.icon className="w-4 h-4" />
        </button>
      ))}
      <div className="h-px bg-[#222429] my-1 mx-1" />
      <button title="Lock All Drawings" onClick={() => setIsLocked(!isLocked)} className={`p-2 rounded hover:bg-[#1B1C20] transition-colors ${isLocked ? "text-amber-400 bg-amber-400/10" : "text-[#787B86] hover:text-[#D1D4DC]"}`}>
        <Lock className="w-4 h-4" />
      </button>
      <button title="Hide All Drawings" onClick={() => setIsVisible(!isVisible)} className={`p-2 rounded hover:bg-[#1B1C20] transition-colors ${!isVisible ? "text-amber-400 bg-amber-400/10" : "text-[#787B86] hover:text-[#D1D4DC]"}`}>
        <Eye className="w-4 h-4" />
      </button>
      <button title="Remove All Drawings" className="p-2 rounded hover:bg-[#1B1C20] text-[#787B86] hover:text-[#F23645] transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
