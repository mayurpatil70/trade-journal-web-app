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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="dark-luxury-card relative w-full max-w-md bg-gradient-to-br from-[#161412] via-[#0f1115] to-[#0a0c0f] border border-amber-500/35 rounded-3xl shadow-[0_20px_80px_rgba(245,158,11,0.28),0_1px_0_rgba(255,255,255,0.08)_inset] overflow-hidden group">
        {/* Ambient Gold Glow Effects */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-amber-500/25 via-yellow-500/15 to-transparent rounded-full blur-3xl pointer-events-none group-hover:from-amber-500/35 transition-all duration-500" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-tr from-amber-500/20 via-yellow-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Glossy specular top rim highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-300/50 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all border border-white/10 backdrop-blur-md cursor-pointer hover:scale-105"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 relative z-10 flex flex-col items-center text-center">
          <BrandLogo className="h-16 w-auto object-contain mb-5 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" />

          <h2
            className="text-2xl font-black mb-3 leading-tight tracking-tight drop-shadow-sm"
            style={{ color: '#ffffff' }}
          >
            Unlock the Prop Firm Pass Masterclass
          </h2>
          
          <p
            className="text-sm font-medium mb-8 leading-relaxed max-w-sm"
            style={{ color: 'rgba(254, 243, 199, 0.92)' }}
          >
            Get detailed guidance from industry experts. Start-to-end help until your payout arrives. 
            Join the elite circle of funded traders today!
          </p>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate('/accounts');
            }}
            className="w-full py-4 font-black text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-2 tracking-wide cursor-pointer group/btn"
            style={{
              background: 'linear-gradient(180deg, #fef08a 0%, #facc15 35%, #eab308 70%, #ca8a04 100%)',
              color: '#422006',
              border: '1px solid rgba(254, 240, 138, 0.9)',
              boxShadow: '0 0 28px rgba(234, 179, 8, 0.55), 0 4px 14px rgba(202, 138, 4, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.9), inset 0 -2px 3px rgba(113, 63, 18, 0.35)',
              textShadow: '0 1px 0 rgba(255, 255, 255, 0.5)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 0 38px rgba(234, 179, 8, 0.8), 0 6px 20px rgba(202, 138, 4, 0.5), inset 0 1px 2px rgba(255, 255, 255, 1), inset 0 -2px 3px rgba(113, 63, 18, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 0 28px rgba(234, 179, 8, 0.55), 0 4px 14px rgba(202, 138, 4, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.9), inset 0 -2px 3px rgba(113, 63, 18, 0.35)';
            }}
          >
            <span>Get Access - $7</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
