import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function AutoPlayVideo({ src, style }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(e => console.log('Autoplay blocked by browser:', e));
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.4 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) observer.unobserve(videoRef.current);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      loop
      playsInline
      style={{ display: 'block', objectFit: 'cover', ...style }}
    />
  );
}

export default function ExtraVideos() {
  const sectionRef = useRef(null);
  const contentWrapRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentWrapRef.current,
        {
          scale: 0.8,
          rotateX: 0,
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
        borderTop: '1px solid rgb(var(--l-fg) / 0.05)',
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
          gap: '32px',
          
          
          
          willChange: 'transform'
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto', marginBottom: '16px' }}>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 900,
            color: "var(--l-ink)",
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}>
            Experience the <span style={{ color: 'var(--l-gain)' }}>Ecosystem</span>
          </h2>
        </div>

        {/* 2 vertically 9:16 videos */}
        <div className="flex flex-col md:flex-row gap-6">
          <div style={{ flex: 1, borderRadius: '20px', overflow: 'hidden', background: 'rgb(var(--l-fg) / 0.05)', border: '1px solid rgb(var(--l-fg) / 0.1)', boxShadow: '0 30px 60px rgb(var(--l-shadow) / calc(0.4 * var(--l-sh-k)))', aspectRatio: '9/16' }}>
            <AutoPlayVideo 
              src="https://res.cloudinary.com/b4c8jnri/video/upload/q_auto,f_auto/v1/gemini_generated_video_bea5a79e"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <div style={{ flex: 1, borderRadius: '20px', overflow: 'hidden', background: 'rgb(var(--l-fg) / 0.05)', border: '1px solid rgb(var(--l-fg) / 0.1)', boxShadow: '0 30px 60px rgb(var(--l-shadow) / calc(0.4 * var(--l-sh-k)))', aspectRatio: '9/16' }}>
            <AutoPlayVideo 
              src="https://res.cloudinary.com/b4c8jnri/video/upload/q_auto,f_auto/v1/gemini_generated_video_419a1f73"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* 1 16:9 video */}
        <div style={{ width: '100%', borderRadius: '20px', overflow: 'hidden', background: 'rgb(var(--l-fg) / 0.05)', border: '1px solid rgb(var(--l-fg) / 0.1)', boxShadow: '0 30px 60px rgb(var(--l-shadow) / calc(0.4 * var(--l-sh-k)))', aspectRatio: '16/9' }}>
          <AutoPlayVideo 
            src="https://res.cloudinary.com/b4c8jnri/video/upload/q_auto,f_auto/v1/gemini_generated_video_e9e377b4"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

      </div>
    </section>
  );
}
