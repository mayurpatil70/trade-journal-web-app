import { useState, useEffect } from 'react';
import { X, Activity, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Show on mount or when hitting /accounts
    const shouldShow = location.pathname === '/accounts' || !sessionStorage.getItem('promoShown');
    if (shouldShow) {
      setIsOpen(true);
      sessionStorage.setItem('promoShown', 'true');
    }
  }, [location.pathname]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-gradient-to-br from-[#121418] to-[#0a0a0a] border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(16,185,129,0.15)] overflow-hidden">
        {/* Glossy Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/30 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-black/40 text-gray-400 hover:text-white hover:bg-black/60 transition-colors border border-white/10 backdrop-blur-md cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6">
            <img src="/logo3d.png" alt="Logo" style={{ width: "40px", height: "40px", objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(255,255,255,0.4))" }} />
          </div>

          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-3 leading-tight">
            Unlock the Prop Firm Pass Masterclass
          </h2>
          
          <p className="text-sm text-gray-300 mb-8 leading-relaxed">
            Get detailed guidance from industry experts. Start-to-end help until your payout arrives. 
            Join the elite circle of funded traders today!
          </p>

          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/accounts');
            }}
            className="w-full relative group overflow-hidden rounded-xl font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(234,179,8,0.4)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="relative px-6 py-4 flex items-center justify-center gap-2 text-yellow-950">
              JOIN NOW - $7 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
