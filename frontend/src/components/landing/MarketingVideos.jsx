import { useEffect, useRef } from 'react';
import { BrainCircuit, ShieldAlert } from 'lucide-react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function AutoPlayVideo({ src, overlayIcon: Icon, overlayTitle, overlayText, gradient }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Play when video enters the viewport
            videoRef.current?.play().catch(e => console.log('Autoplay blocked by browser:', e));
          } else {
            // Pause when video leaves the viewport to save resources and stop sound (though we are muted by default for autoplay rules)
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.4 } // Trigger when 40% of the video is visible
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) observer.unobserve(videoRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex' }}>
      {/* Native HTML5 Video for granular scroll-control */}
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
      />
      
      {/* Marketing Strategy: Premium Feature Overlay Badge */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px',
        background: 'rgba(12, 16, 24, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '12px',
          background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Icon size={20} color="white" />
        </div>
        <div>
          <h4 style={{ color: 'white', fontSize: '15px', fontWeight: 800, marginBottom: '2px', letterSpacing: '-0.01em' }}>
            {overlayTitle}
          </h4>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', lineHeight: 1.4 }}>
            {overlayText}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MarketingVideos() {
  const sectionRef = useRef(null);
  const contentWrapRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentWrapRef.current,
        {
          scale: 0.8,
          rotateX: 15,
          y: 60,
          opacity: 0,
        },
        {
          scale: 1,
          rotateX: 0,
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            end: 'top 30%',
            scrub: 1,
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      style={{
        padding: '100px 20px',
        background: 'rgba(0,0,0,0.4)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div 
        ref={contentWrapRef}
        style={{ 
          maxWidth: '1100px', 
          margin: '0 auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '56px',
          transformStyle: 'preserve-3d',
          perspective: '1200px',
          perspectiveOrigin: '50% 40%',
          willChange: 'transform'
        }}
      >
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            borderRadius: '999px',
            background: 'rgba(47,141,244,0.1)',
            border: '1px solid rgba(47,141,244,0.25)',
            fontSize: '10px',
            color: '#2f8df4',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            Platform Preview
          </div>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: '16px',
          }}>
            See Forex Notes <span style={{ color: '#2f8df4' }}>in Action</span>
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
            An AI-powered trading journal for traders who are serious about improving. Watch how our automated dashboard prevents emotional mistakes and tracks your prop firm limits in real-time.
          </p>
        </div>

        {/* Video Grid */}
        <div className="flex flex-col md:flex-row gap-8">
          <div style={{ flex: 1, borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
            <AutoPlayVideo 
              src="https://res.cloudinary.com/b4c8jnri/video/upload/q_auto,f_auto/v1/Video_1.mp4"
              overlayIcon={BrainCircuit}
              overlayTitle="AI Psychology Pre-Check"
              overlayText="Forces you to evaluate your emotional state before you execute a trade."
              gradient="linear-gradient(135deg, #ec4899, #8b5cf6)"
            />
          </div>
          <div style={{ flex: 1, borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
            <AutoPlayVideo 
              src="https://res.cloudinary.com/b4c8jnri/video/upload/q_auto,f_auto/v1/Video.mp4"
              overlayIcon={ShieldAlert}
              overlayTitle="Live Prop Firm Tracking"
              overlayText="Automated alerts when you approach your daily drawdown threshold."
              gradient="linear-gradient(135deg, #10b981, #059669)"
            />
          </div>
        </div>
        
      </div>
    </section>
  );
}
