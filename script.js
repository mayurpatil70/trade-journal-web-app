const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/LandingPage.jsx', 'utf8');

// 1. Theme replacements
content = content.replace(/#2f8df4/g, '#10b981'); // blue to emerald
content = content.replace(/#22d3ee/g, '#059669'); // cyan to darker emerald
content = content.replace(/#1d6fd8/g, '#047857'); // dark blue to dark emerald

// 2. Import ExtraVideos
if (!content.includes('ExtraVideos')) {
  content = content.replace(
    'import FeaturesBento from "../components/landing/FeaturesBento";',
    'import FeaturesBento from "../components/landing/FeaturesBento";\nimport ExtraVideos from "../components/landing/ExtraVideos";'
  );

  // 3. Inject ExtraVideos before Discord Community CTA
  content = content.replace(
    '{/* ── Discord Community CTA ── */}',
    '<ExtraVideos />\n\n        {/* ── Discord Community CTA ── */}'
  );
}

// 4. Update pricing section copy and structure
// Let's replace the single Lifetime pricing block with Monthly/Yearly options
const oldPricingSectionRegex = /<div\s+className="pricing-card"[\s\S]*?Join Now for \$11 USDT — Lifetime Access[\s\S]*?<\/div>\s*<\/div>/;

const newPricingSection = `
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', textAlign: 'left' }}>
              {/* Monthly Plan */}
              <div
                className="pricing-card"
                style={{
                  background: "rgba(12,16,24,0.85)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(16,185,129,0.35)",
                  borderRadius: "24px",
                  padding: "40px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 0 40px rgba(16,185,129,0.05), 0 40px 80px rgba(0,0,0,0.6)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", paddingBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <h3 style={{ fontSize: "22px", fontWeight: 900, color: "white", letterSpacing: "-0.02em", marginBottom: "6px" }}>
                      Monthly Plan
                    </h3>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                      Pay as you go access
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "42px", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>$19</div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>/month</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                  {PRICING_FEATURES.slice(0, 5).map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/login"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    width: "100%", padding: "16px", borderRadius: "14px",
                    background: "transparent",
                    border: "1px solid rgba(16,185,129,0.4)",
                    color: "white", fontSize: "14px", fontWeight: 800,
                    textDecoration: "none", letterSpacing: "0.01em",
                    transition: "all 0.2s",
                  }}
                >
                  Join Monthly
                </Link>
              </div>

              {/* Yearly Plan */}
              <div
                className="pricing-card"
                style={{
                  background: "rgba(12,16,24,0.85)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "2px solid #10b981",
                  borderRadius: "24px",
                  padding: "40px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 0 80px rgba(16,185,129,0.15), 0 40px 80px rgba(0,0,0,0.6)",
                }}
              >
                {/* Glow */}
                <div style={{
                  position: "absolute", top: "-60px", right: "-60px",
                  width: "300px", height: "300px",
                  background: "radial-gradient(ellipse, rgba(16,185,129,0.2) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                
                {/* Badge */}
                <div style={{
                  position: "absolute", top: 0, right: 0,
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white", fontSize: "9px", fontWeight: 900,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "8px 20px", borderBottomLeftRadius: "12px",
                }}>
                  Best Value
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", paddingBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <h3 style={{ fontSize: "22px", fontWeight: 900, color: "white", letterSpacing: "-0.02em", marginBottom: "6px" }}>
                      Yearly Plan
                    </h3>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                      Save 30% annually
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "42px", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>$149</div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>/year</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                  {PRICING_FEATURES.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/login"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    width: "100%", padding: "16px", borderRadius: "14px",
                    background: "linear-gradient(135deg, #10b981, #047857)",
                    color: "white", fontSize: "14px", fontWeight: 800,
                    textDecoration: "none", letterSpacing: "0.01em",
                    boxShadow: "0 8px 32px rgba(16,185,129,0.4)",
                    transition: "all 0.2s",
                  }}
                >
                  <Zap size={16} />
                  Join Yearly
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>`;

content = content.replace(oldPricingSectionRegex, newPricingSection);

// Update some text headers regarding the "Lifetime access"
content = content.replace('One-time lifetime payment — zero subscriptions', 'Affordable monthly & yearly plans available');
content = content.replace('Single $11 USDT Lifetime Payment', 'Flexible Monthly & Yearly Memberships');
content = content.replace('One Single Payment.<br />Zero Monthly Fees.', 'Choose Your Plan.<br />Cancel Anytime.');
content = content.replace('No recurring charges. Pay once via on-chain USDT and receive instant lifetime access.', 'Select the best plan that fits your trading journey. Gain instant access today.');
content = content.replace('Forex Notes — Lifetime Access via On-Chain USDT · No Subscriptions, Ever.', 'Forex Notes — Track, analyze, and optimize your trading strategy automatically.');
content = content.replace('Get Access ($11)', 'Get Access');

fs.writeFileSync('frontend/src/pages/LandingPage.jsx', content);
