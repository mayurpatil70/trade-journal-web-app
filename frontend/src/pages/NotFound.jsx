export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#ec4899', marginBottom: '16px' }}>404</h1>
      <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', marginBottom: '32px' }}>Page not found.</p>
      <a href="/" style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 600 }}>Return Home</a>
    </div>
  );
}
