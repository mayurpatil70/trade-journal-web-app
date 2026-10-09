import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-popover text-popover-foreground border border-border rounded-3xl shadow-[0_20px_80px_rgba(16,185,129,0.18)] overflow-hidden">
        {/* Glossy Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-foreground/[0.02] to-foreground/[0.05] pointer-events-none" />
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border backdrop-blur-md cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 relative z-10 flex flex-col items-center text-center">
          <BrandLogo className="h-16 w-auto object-contain mb-5" />

          <h2 className="text-2xl font-black text-foreground mb-3 leading-tight">
            Unlock the Prop Firm Pass Masterclass
          </h2>
          
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
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
