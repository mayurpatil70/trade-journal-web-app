import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { useTheme } from './theme-provider';

export default function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

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
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300 ${
        isDark ? 'bg-black/70' : 'bg-black/45'
      }`}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl overflow-hidden group transition-colors duration-300 ${
          isDark
            ? 'dark-luxury-card bg-gradient-to-br from-[#161412] via-[#0f1115] to-[#0a0c0f] border border-amber-500/35 shadow-[0_20px_80px_rgba(245,158,11,0.28),0_1px_0_rgba(255,255,255,0.08)_inset]'
            : 'bg-white border border-amber-300/40 shadow-[0_25px_70px_rgba(245,158,11,0.18),0_10px_30px_rgba(0,0,0,0.08)]'
        }`}
      >
        {/* Ambient Gold Glow Effects */}
        {isDark ? (
          <>
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-amber-500/25 via-yellow-500/15 to-transparent rounded-full blur-3xl pointer-events-none group-hover:from-amber-500/35 transition-all duration-500" />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-tr from-amber-500/20 via-yellow-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-300/50 to-transparent pointer-events-none" />
          </>
        ) : (
          <>
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-amber-200/40 via-yellow-100/30 to-transparent rounded-full blur-3xl pointer-events-none group-hover:from-amber-300/40 transition-all duration-500" />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-tr from-amber-200/30 via-yellow-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />
          </>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
          }}
          className={`absolute top-4 right-4 z-[110] p-2 rounded-full transition-all backdrop-blur-md cursor-pointer hover:scale-105 ${
            isDark
              ? 'bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/10'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border border-gray-200/80 shadow-sm'
          }`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 relative z-10 flex flex-col items-center text-center">
          <BrandLogo
            className={`h-16 w-auto object-contain mb-5 ${
              isDark ? 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]' : 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
            }`}
          />

          <h2
            className={`text-2xl font-black mb-3 leading-tight tracking-tight drop-shadow-sm ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
            style={{ color: isDark ? '#ffffff' : '#0f172a' }}
          >
            Unlock the Prop Firm Pass Masterclass
          </h2>

          <p
            className="text-sm font-medium mb-8 leading-relaxed max-w-sm"
            style={{ color: isDark ? 'rgba(254, 243, 199, 0.92)' : '#475569' }}
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
              border: isDark ? '1px solid rgba(254, 240, 138, 0.9)' : '1px solid rgba(254, 240, 138, 0.95)',
              boxShadow: isDark
                ? '0 0 28px rgba(234, 179, 8, 0.55), 0 4px 14px rgba(202, 138, 4, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.9), inset 0 -2px 3px rgba(113, 63, 18, 0.35)'
                : '0 0 26px rgba(234, 179, 8, 0.5), 0 4px 14px rgba(202, 138, 4, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.95), inset 0 -2px 3px rgba(113, 63, 18, 0.35)',
              textShadow: '0 1px 0 rgba(255, 255, 255, 0.5)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = isDark
                ? '0 0 38px rgba(234, 179, 8, 0.8), 0 6px 20px rgba(202, 138, 4, 0.5), inset 0 1px 2px rgba(255, 255, 255, 1), inset 0 -2px 3px rgba(113, 63, 18, 0.4)'
                : '0 0 36px rgba(234, 179, 8, 0.75), 0 6px 20px rgba(202, 138, 4, 0.45), inset 0 1px 2px rgba(255, 255, 255, 1), inset 0 -2px 3px rgba(113, 63, 18, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = isDark
                ? '0 0 28px rgba(234, 179, 8, 0.55), 0 4px 14px rgba(202, 138, 4, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.9), inset 0 -2px 3px rgba(113, 63, 18, 0.35)'
                : '0 0 26px rgba(234, 179, 8, 0.5), 0 4px 14px rgba(202, 138, 4, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.95), inset 0 -2px 3px rgba(113, 63, 18, 0.35)';
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
