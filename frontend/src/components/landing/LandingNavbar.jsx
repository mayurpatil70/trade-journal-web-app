// frontend/src/components/landing/LandingNavbar.jsx
// Apple iOS / macOS Sequoia Blueprint Floating Glass Pill Navbar
// Strict Color Palette: Black, White, Gray, Emerald Green (No random cyans/purples)
// High-Fidelity Glassmorphism with Continuous Squircle Geometry

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, BarChart2, Shield, BookOpen, Calculator, Layers, Zap } from 'lucide-react';
import BrandLogo from '../BrandLogo';

const NAV_LINKS = [
  { label: 'Markets', to: '/markets/four-asset-classes', icon: Layers },
  { label: 'Backtesting', to: '/backtesting/btcusdt', icon: BarChart2 },
  { label: 'Journal', to: '/journal/xauusd', icon: BookOpen },
  { label: 'Free Tools', to: '/tools/ftmo-drawdown-calculator', icon: Calculator },
  { label: 'Compare', to: '/vs/tradezella', icon: Shield },
  { label: 'Pricing', to: '/#pricing', isAnchor: true },
];

export default function LandingNavbar({ isFixed = true }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  // Scroll detection for subtle dynamic blur adjustment
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleAnchorClick = (id) => {
    setMobileMenuOpen(false);
    if (pathname === '/') {
      const el = document.getElementById(id.replace(/^#/, ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.location.href = '/' + id;
  };

  return (
    <>
      {/* ── Apple macOS / iOS Floating Glass Island Header ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-[80] transition-all duration-300 px-4 md:px-8 ${
          scrolled ? 'pt-2.5 pb-2.5' : 'pt-4 pb-3'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Main Floating Glass Capsule */}
          <div className="w-full flex items-center justify-between px-4 sm:px-6 py-2.5 rounded-full bg-[#0a0c12]/75 dark:bg-[#0a0c12]/80 backdrop-blur-2xl border border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-300">
            {/* Left: Brand Identity */}
            <Link
              to="/"
              className="flex items-center gap-2.5 py-1 px-2 rounded-full hover:bg-white/5 transition-colors group cursor-pointer"
              onClick={() => {
                if (pathname === '/') {
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }
              }}
            >
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <img
                  src="/logo3d.png"
                  alt="Forex Notes"
                  className="w-4 h-4 object-contain drop-shadow"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-[13px] font-extrabold tracking-[0.14em] text-white uppercase">
                  FOREX
                </span>
                <span className="font-serif italic text-[16px] text-emerald-400 font-normal">
                  Notes
                </span>
              </div>
            </Link>

            {/* Center: Desktop Apple Segmented Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-black/20 border border-white/[0.06] rounded-full p-1">
              {NAV_LINKS.map((item) => {
                const isActive = pathname === item.to;
                if (item.isAnchor) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleAnchorClick(item.to.replace('/', ''))}
                      className="px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
                    >
                      {item.label}
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-white/10 text-emerald-400 font-semibold border border-white/10 shadow-sm'
                        : 'text-neutral-300 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Actions Cluster */}
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-[12px] font-semibold text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors border border-transparent hover:border-white/10"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-[12px] font-bold text-black bg-emerald-400 hover:bg-emerald-300 transition-all duration-200 shadow-md shadow-emerald-500/25 active:scale-95 cursor-pointer"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {/* Hamburger Button for Mobile & Tablet */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="lg:hidden p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10 transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Apple iOS / macOS Frosted Drawer Menu ── */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-[88] bg-black/60 backdrop-blur-md transition-opacity duration-200"
          />

          {/* Drawer Sheet */}
          <div className="fixed top-20 right-4 sm:right-8 z-[89] w-[min(380px,calc(100vw-32px))] max-h-[calc(100vh-100px)] overflow-y-auto bg-[#0e1117]/95 backdrop-blur-3xl border border-white/12 rounded-3xl p-5 shadow-[0_25px_70px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.15)] animate-in fade-in zoom-in-95 duration-200 flex flex-col justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between pb-3 px-1 border-b border-white/[0.08]">
                <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase font-mono">
                  PLATFORM NAVIGATION
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-2 space-y-1">
                {NAV_LINKS.map((item) => {
                  const Icon = item.icon || Zap;
                  if (item.isAnchor) {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleAnchorClick(item.to.replace('/', ''))}
                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-neutral-200 text-sm font-medium transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span>{item.label}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                      </button>
                    );
                  }

                  const isActive = pathname === item.to;
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                        isActive
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-semibold'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-neutral-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <ArrowRight className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-neutral-500'}`} />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/[0.08] space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] text-neutral-200 text-xs font-semibold border border-white/10 transition-colors"
              >
                Sign In to Your Workspace
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
