export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--paper)', color: 'var(--ink)' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#ec4899', marginBottom: '16px' }}>404</h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--ink-mute)', marginBottom: '32px' }}>Page not found.</p>
      <a href="/" style={{ padding: '12px 24px', backgroundColor: '#059669', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 600 }}>Return Home</a>
    </div>
  );
}
