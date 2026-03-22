'use client';

import { useEffect, useState } from 'react';

/* ── Code snippets ─────────────────────────────────────────────── */
const codeSnips: Record<string, string> = {
  js: `<span class="cm">// Screenshot in 3 lines</span><span class="kw">const</span> res = <span class="kw">await</span> <span class="fn">fetch</span>(<span class="st">"https://pixnab.dev/api/screenshot"</span>, {
  method: <span class="st">"POST"</span>,
  headers: { <span class="st">"Authorization"</span>: <span class="st">"Bearer px_..."</span> },
  body: <span class="fn">JSON</span>.stringify({ url: <span class="st">"https://example.com"</span> })
});
<span class="kw">const</span> buf = <span class="fn">Buffer</span>.from(<span class="kw">await</span> res.<span class="fn">arrayBuffer</span>());
fs.<span class="fn">writeFileSync</span>(<span class="st">"shot.png"</span>, buf);
<span class="cm">// → 200 OK · image/png · 284KB · 1.4s</span>`,

  py: `<span class="cm"># Screenshot in Python</span>
<span class="kw">import</span> requests
res = requests.post(
    <span class="st">"https://pixnab.dev/api/screenshot"</span>,
    headers={<span class="st">"Authorization"</span>: <span class="st">"Bearer px_..."</span>},
    json={<span class="st">"url"</span>: <span class="st">"https://example.com"</span>})
<span class="kw">with</span> open(<span class="st">"shot.png"</span>, <span class="st">"wb"</span>) <span class="kw">as</span> f:
    f.write(res.content)
<span class="cm"># → 200 OK · image/png · 284KB · 1.4s</span>`,

  curl: `<span class="cm"># Screenshot with cURL</span>
curl -X POST https://pixnab.dev/api/screenshot \\
  -H <span class="st">"Authorization: Bearer px_..."</span> \\
  -H <span class="st">"Content-Type: application/json"</span> \\
  -d <span class="st">'{"url":"https://example.com"}'</span> \\
  --output shot.png
<span class="cm"># Saves shot.png directly · 1.4s</span>`,

  go: `<span class="cm">// Screenshot in Go</span>
resp, _ := http.Post(
    <span class="st">"https://pixnab.dev/api/screenshot"</span>,
    <span class="st">"application/json"</span>,
    strings.NewReader(<span class="st">\`{"url":"https://example.com"}\`</span>),
)
defer resp.Body.Close()
data, _ := io.ReadAll(resp.Body)
os.WriteFile(<span class="st">"shot.png"</span>, data, <span class="nu">0644</span>)
<span class="cm">// → 200 OK · image/png · 284KB · 1.4s</span>`,
};

/* ── Step data ──────────────────────────────────────────────────── */
type StepId = 's1' | 's2' | 's3';
const stepData: Record<StepId, { label: string; code: string }> = {
  s1: {
    label: 'Step 1 — Generate key',
    code: `<span class="cm"># Create your API key</span>
curl -X POST https://pixnab.dev/api/keys \\
  -H <span class="st">"Content-Type: application/json"</span> \\
  -d <span class="st">'{"user_email":"you@email.com"}'</span>
<span class="cm"># Response:</span>
{
  <span class="st">"key"</span>: <span class="hl">"px_a3f9c2d8e1..."</span>,
  <span class="st">"plan"</span>: <span class="st">"free"</span>,
  <span class="nu">"credit_limit"</span>: <span class="nu">100</span>
}
<span class="cm"># Save this key — shown once</span>`,
  },
  s2: {
    label: 'Step 2 — POST the URL',
    code: `<span class="cm"># Capture a screenshot</span>
curl -X POST https://pixnab.dev/api/screenshot \\
  -H <span class="st">"Authorization: Bearer px_..."</span> \\
  -H <span class="st">"Content-Type: application/json"</span> \\
  -d <span class="st">'{"url":"https://vercel.com"}'</span> \\
  --output shot.png

<span class="cm"># One request. One file. Done.</span>`,
  },
  s3: {
    label: 'Step 3 — Check credits',
    code: `<span class="cm"># Monitor your usage</span>
curl https://pixnab.dev/api/usage \\
  -H <span class="st">"Authorization: Bearer px_..."</span>
<span class="cm"># Response:</span>
{
  <span class="nu">"credits_used"</span>: <span class="nu">1</span>,
  <span class="nu">"credit_limit"</span>: <span class="nu">100</span>,
  <span class="hl">"credits_remaining"</span>: <span class="hl">99</span>
}`,
  },
};

/* ── Marquee items ──────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  { label: 'Cursor', icon: <svg viewBox="0 0 24 24" fill="none"><path d="M4 4l7 19 3-7 7-3L4 4z" fill="currentColor"/></svg> },
  { label: 'N8N', icon: <svg viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="2.5" fill="currentColor"/><circle cx="19" cy="5" r="2.5" fill="currentColor"/><circle cx="19" cy="19" r="2.5" fill="currentColor"/><path d="M7.5 12h4M13.5 5H11a2 2 0 00-2 2v10a2 2 0 002 2h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { label: 'Zapier', icon: <svg viewBox="0 0 24 24" fill="none"><path d="M13 2L4.5 13.5H11L10 22l9-12.5H13z" fill="currentColor"/></svg> },
  { label: 'Make', icon: <svg viewBox="0 0 24 24" fill="none"><path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M12 8v8M8.5 10l3.5 2 3.5-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { label: 'Pipedream', icon: <svg viewBox="0 0 24 24" fill="none"><circle cx="4" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="20" cy="12" r="2" fill="currentColor"/><path d="M6 12h4M14 12h4M12 6v2M12 16v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { label: 'Claude', icon: <svg viewBox="0 0 24 24" fill="none"><path d="M17.5 8A7 7 0 1 0 17.5 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M20 6l-2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { label: 'GPT-4o', icon: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2.5" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)"/></svg> },
  { label: 'Lovable', icon: <svg viewBox="0 0 24 24" fill="none"><path d="M12 21C12 21 3 14.5 3 8.5A4.5 4.5 0 0 1 12 6.27 4.5 4.5 0 0 1 21 8.5C21 14.5 12 21 12 21z" fill="currentColor"/></svg> },
  { label: 'Bolt', icon: <svg viewBox="0 0 24 24" fill="none"><path d="M11 2L4 14h7l-2 8 9-12h-7z" fill="currentColor"/></svg> },
  { label: 'Windsurf', icon: <svg viewBox="0 0 24 24" fill="none"><path d="M3 14c2-4 4-6 6-6s4 4 6 4 4-4 6-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M3 19c2-4 4-6 6-6s4 4 6 4 4-4 6-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".45"/></svg> },
];

/* ═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'js' | 'py' | 'curl' | 'go'>('js');
  const [activeStep, setActiveStep] = useState<StepId>('s1');
  const [svFading, setSvFading] = useState(false);
  const [svContent, setSvContent] = useState({ label: stepData.s1.label, code: stepData.s1.code });

  /* Custom cursor */
  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0;
    let rafId: number;
    const cur = document.getElementById('cursor');
    const ring = document.getElementById('cursor-ring');
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (cur) { cur.style.left = mx + 'px'; cur.style.top = my + 'px'; }
    };
    document.addEventListener('mousemove', onMove);
    const loop = () => {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }
      rafId = requestAnimationFrame(loop);
    };
    loop();
    return () => { document.removeEventListener('mousemove', onMove); cancelAnimationFrame(rafId); };
  }, []);

  /* Nav scroll class */
  useEffect(() => {
    const nav = document.getElementById('main-nav');
    const fn = () => nav?.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* Scroll reveal */
  useEffect(() => {
    const ro = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.rv').forEach(el => ro.observe(el));
    return () => ro.disconnect();
  }, []);

  /* Bento mouse glow */
  useEffect(() => {
    const fns = new Map<Element, EventListener>();
    document.querySelectorAll('.b').forEach(b => {
      const fn: EventListener = (ev) => {
        const e = ev as MouseEvent;
        const r = b.getBoundingClientRect();
        (b as HTMLElement).style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        (b as HTMLElement).style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      };
      b.addEventListener('mousemove', fn);
      fns.set(b, fn);
    });
    return () => fns.forEach((fn, b) => b.removeEventListener('mousemove', fn));
  }, []);

  /* Terminal animation */
  useEffect(() => {
    const ids = ['tl1', 'tl2', 'tl3', 'tl4', 'tl5'];
    const timers: ReturnType<typeof setTimeout>[] = [];
    ids.forEach((id, i) => {
      timers.push(setTimeout(() => document.getElementById(id)?.classList.add('show'), 900 + i * 420));
    });
    timers.push(setTimeout(() => document.getElementById('resultPreview')?.classList.add('show'), 900 + ids.length * 420 + 300));
    return () => timers.forEach(clearTimeout);
  }, []);

  /* Counter animation */
  useEffect(() => {
    function animNum(el: HTMLElement, target: number, decimals: number) {
      const dur = 1800, step = 16;
      let elapsed = 0;
      const t = setInterval(() => {
        elapsed += step;
        el.textContent = (target * (1 - Math.pow(1 - elapsed / dur, 3))).toFixed(decimals);
        if (elapsed >= dur) { el.textContent = target.toFixed(decimals); clearInterval(t); }
      }, step);
    }
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = (id: string) => document.getElementById(id) as HTMLElement | null;
        const s1 = el('hs1'), s2 = el('hs2'), s3 = el('hs3');
        if (s1) animNum(s1, 1.4, 1);
        if (s2) animNum(s2, 99.9, 1);
        if (s3) animNum(s3, 1, 0);
        ro.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    const hs = document.querySelector('.hero-stats');
    if (hs) ro.observe(hs);
    return () => ro.disconnect();
  }, []);

  /* Credit bars */
  useEffect(() => {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.querySelectorAll<HTMLElement>('.cb-fill').forEach((bar, i) => {
          setTimeout(() => { bar.style.width = (bar.dataset.w ?? '0') + '%'; }, i * 120);
        });
        ro.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    const cb = document.getElementById('creditBars');
    if (cb) ro.observe(cb);
    return () => ro.disconnect();
  }, []);

  /* Step change */
  const handleStep = (id: StepId) => {
    setActiveStep(id);
    setSvFading(true);
    setTimeout(() => { setSvContent({ label: stepData[id].label, code: stepData[id].code }); setSvFading(false); }, 220);
  };

  /* Tab change */
  const handleTab = (tab: 'js' | 'py' | 'curl' | 'go') => setActiveTab(tab);

  /* ── JSX ─────────────────────────────────────────────────────── */
  return (
    <>
      <div id="cursor" />
      <div id="cursor-ring" />

      <div className="orbs" aria-hidden="true">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
      </div>

      {/* NAV */}
      <nav id="main-nav">
        <a href="#" className="nav-logo">
          Pixnab<span className="nav-logo-dot" />
        </a>
        <div className="nav-pill">
          <a href="#features">Features</a>
          <a href="#docs">API</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="nav-right">
          <a href="/login" className="nbtn nbtn-ghost">Log in</a>
          <a href="/signup" className="nbtn nbtn-solid">Get API key →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-left">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Now in open beta · 100 free credits
          </div>
          <h1 className="hero-h1">
            <span className="line"><span>The screenshot</span></span>
            <span className="line"><span>API <em>built for</em></span></span>
            <span className="line"><span>developers.</span></span>
          </h1>
          <p className="hero-sub">
            One endpoint. Send a URL, get a pixel-perfect PNG.<br />
            No browser required. No setup. Just ship.
          </p>
          <div className="hero-actions">
            <a href="/signup" className="hero-cta">
              Start free
              <span className="hero-cta-arrow">→</span>
            </a>
            <a href="#docs" className="hero-ghost">View docs</a>
          </div>
          <div className="hero-stats">
            <div>
              <span className="stat-num"><span id="hs1">1.4</span>s</span>
              <span className="stat-lab">avg response</span>
            </div>
            <div>
              <span className="stat-num"><span id="hs2">99.9</span>%</span>
              <span className="stat-lab">uptime SLA</span>
            </div>
            <div>
              <span className="stat-num"><span id="hs3">1</span> endpoint</span>
              <span className="stat-lab">to learn</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="browser">
            <div className="browser-bar">
              <div className="bdots">
                <span style={{ background: '#FF5F57' }} />
                <span style={{ background: '#FEBC2E' }} />
                <span style={{ background: '#28C840' }} />
              </div>
              <div className="browser-url">pixnab.dev/api/screenshot</div>
            </div>
            <div className="browser-body">
              <div className="terminal">
                <div className="term-bar">
                  <div className="tdot" style={{ background: '#FF5F57' }} />
                  <div className="tdot" style={{ background: '#FEBC2E' }} />
                  <div className="tdot" style={{ background: '#28C840' }} />
                  <span style={{ fontSize: 11, color: '#5c6370', fontFamily: 'var(--mono)', marginLeft: 12 }}>bash</span>
                </div>
                <div className="term-body">
                  <div className="term-line" id="tl1"><span className="t-prompt">$</span><span className="t-cmd">curl -X POST https://pixnab.dev/api/screenshot \</span></div>
                  <div className="term-line" id="tl2"><span className="t-prompt" style={{ opacity: 0 }}>$</span><span className="t-cmd" style={{ paddingLeft: 16 }}>-H <span className="t-str">&quot;Authorization: Bearer px_a3f9...&quot;</span> \</span></div>
                  <div className="term-line" id="tl3"><span className="t-prompt" style={{ opacity: 0 }}>$</span><span className="t-cmd" style={{ paddingLeft: 16 }}>-H <span className="t-str">&quot;Content-Type: application/json&quot;</span> \</span></div>
                  <div className="term-line" id="tl4"><span className="t-prompt" style={{ opacity: 0 }}>$</span><span className="t-cmd" style={{ paddingLeft: 16 }}>-d <span className="t-str">&apos;&#123;&quot;url&quot;:&quot;https://stripe.com&quot;&#125;&apos;</span> \</span></div>
                  <div className="term-line" id="tl5"><span className="t-prompt" style={{ opacity: 0 }}>$</span><span className="t-cmd" style={{ paddingLeft: 16 }}>--output shot.png</span></div>
                  <div className="result-preview" id="resultPreview">
                    <div className="result-thumb">PNG<br />284KB</div>
                    <div>
                      <div className="result-name">shot.png</div>
                      <div className="result-meta">1280 × 800 · image/png · 284KB</div>
                      <div className="result-badge">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" fill="#00e5a0"/></svg>
                        200 OK · 1.4s
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="marquee-item">
              {item.icon}
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features">
        <div className="container">
          <div className="sh rv" style={{ maxWidth: 520 }}>
            <div className="sh-eye">Features</div>
            <div className="sh-title">Everything you need,<br /><em>nothing you don&apos;t.</em></div>
            <p className="sh-body">Built for developers who ship fast. No SDKs, no wrappers — just a clean HTTP API.</p>
          </div>

          <div className="bento">
            {/* B1 */}
            <div className="b b1 rv">
              <div className="b-n">01 — Speed</div>
              <div className="b-stat">1.4<sub>s</sub></div>
              <div className="b-title">Screenshots at the speed of thought.</div>
              <div className="b-desc">Headless Chrome warm-starts eliminate cold boot latency. Results return in under two seconds, guaranteed.</div>
              <div className="b-tag">⚡ &lt;2s p99</div>
            </div>

            {/* B2 */}
            <div className="b b2 rv">
              <div className="b-n">02 — Simple</div>
              <div className="b-title">One endpoint.</div>
              <div className="b-desc">POST a URL. Receive a PNG. No config files, no client library, no surprises.</div>
              <div className="b-tag">→ /api/screenshot</div>
            </div>

            {/* B3 */}
            <div className="b b3 rv">
              <div className="b-n">03 — Credits</div>
              <div className="b-title">Transparent usage.</div>
              <div className="b-desc">Every plan shows real-time credit consumption. Upgrade only when you need to.</div>
              <div className="credit-bar" id="creditBars">
                <div className="cb-row">
                  <span className="cb-label">Free</span>
                  <div className="cb-track"><div className="cb-fill" data-w="20" /></div>
                  <span className="cb-val">100</span>
                </div>
                <div className="cb-row">
                  <span className="cb-label">Starter</span>
                  <div className="cb-track"><div className="cb-fill" data-w="55" /></div>
                  <span className="cb-val">2K</span>
                </div>
                <div className="cb-row">
                  <span className="cb-label">Pro</span>
                  <div className="cb-track"><div className="cb-fill" data-w="100" /></div>
                  <span className="cb-val">20K</span>
                </div>
              </div>
            </div>

            {/* B4 */}
            <div className="b b4 rv">
              <div className="b-n">04 — Viewports</div>
              <div className="b-title">Any device size.</div>
              <div className="b-desc">Desktop, tablet, and mobile renders in one request.</div>
              <div className="viewport-row">
                <div className="vp vp-d">1280×800</div>
                <div className="vp vp-t">768×1024</div>
                <div className="vp vp-m">375×812</div>
              </div>
            </div>

            {/* B5 */}
            <div className="b b5 rv">
              <div className="b-n">05 — Format</div>
              <div className="b-title">Raw binary response.</div>
              <div className="b-desc">Image bytes returned directly — stream to disk, S3, or memory.</div>
              <div className="b5-term">{`Content-Type: image/png\nContent-Length: 284921\nX-Credits-Used: 1\nX-Credits-Remaining: 99`}</div>
            </div>

            {/* B6 */}
            <div className="b b6 rv">
              <div className="b-n">06 — Auth</div>
              <div className="b-title">Bearer token, standard.</div>
              <div className="b-desc">Issue keys from your dashboard instantly. Rotate or revoke at any time.</div>
              <div className="b-tag">Authorization: Bearer px_...</div>
            </div>
          </div>
        </div>
      </section>

      {/* CODE / API DOCS */}
      <section id="docs" style={{ paddingTop: 0, paddingBottom: 110 }}>
        <div className="container">
          <div className="sh rv" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
            <div className="sh-eye">API Reference</div>
            <div className="sh-title" style={{ fontSize: 'clamp(28px,3.5vw,44px)' }}>Drop-in for any language.</div>
            <p className="sh-body" style={{ margin: '14px auto 0', textAlign: 'center' }}>
              If your language can make an HTTP request, it can use Pixnab.
            </p>
          </div>

          <div className="code-showcase rv">
            <div className="code-left">
              <div className="sh-eye">Single endpoint</div>
              <div className="sh-title" style={{ fontSize: 'clamp(24px,2.8vw,38px)', marginBottom: 14 }}>
                POST /api/<em>screenshot</em>
              </div>
              <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.75, fontWeight: 300, marginBottom: 28 }}>
                Send a JSON body with <code style={{ fontFamily: 'var(--mono)', fontSize: 12.5, background: 'var(--w2)', padding: '2px 6px', borderRadius: 4 }}>url</code>. Receive raw PNG bytes. That&apos;s the entire API.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['url', 'string', 'The page to capture'],
                  ['viewport', 'optional', 'e.g. "mobile" or "1440x900"'],
                  ['full_page', 'optional', 'Capture full scrollable height'],
                ].map(([param, type, desc]) => (
                  <div key={param} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <code style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '3px 8px', borderRadius: 5, flexShrink: 0 }}>{param}</code>
                    <span style={{ fontSize: 12, color: 'var(--ink3)', fontFamily: 'var(--mono)', paddingTop: 3 }}>{type}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 300 }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="code-right">
              <div className="crb">
                <div className="lang-tabs">
                  {(['js', 'py', 'curl', 'go'] as const).map(lang => (
                    <button key={lang} className={`ltab${activeTab === lang ? ' on' : ''}`} onClick={() => handleTab(lang)}>
                      {lang}
                    </button>
                  ))}
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#3a4251' }}>pixnab.dev/api/screenshot</span>
              </div>
              <div className="code-pre" dangerouslySetInnerHTML={{ __html: codeSnips[activeTab] }} />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: '0 0 110px' }}>
        <div className="container">
          <div className="sh rv" style={{ maxWidth: 480, marginBottom: 64 }}>
            <div className="sh-eye">How it works</div>
            <div className="sh-title">Up and running in <em>three steps.</em></div>
          </div>

          <div className="steps-grid">
            <div>
              {(['s1', 's2', 's3'] as StepId[]).map((id, idx) => {
                const titles = ['Get your API key', 'Make your first request', 'Track your usage'];
                const descs = [
                  'Sign up and generate a free API key instantly — no credit card required.',
                  'POST any URL to our endpoint and receive a PNG in the response body.',
                  'Monitor credit usage via the dashboard or the /api/usage endpoint.',
                ];
                return (
                  <div key={id} className={`s-item${activeStep === id ? ' on' : ''}`} onClick={() => handleStep(id)}>
                    <div className="s-num">{String(idx + 1).padStart(2, '0')}</div>
                    <div>
                      <div className="s-title">{titles[idx]}</div>
                      <div className="s-desc">{descs[idx]}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="step-visual rv">
              <div className="sv-bar">
                <div className="tdot" style={{ background: '#FF5F57', width: 8, height: 8, borderRadius: '50%' }} />
                <div className="tdot" style={{ background: '#FEBC2E', width: 8, height: 8, borderRadius: '50%' }} />
                <div className="tdot" style={{ background: '#28C840', width: 8, height: 8, borderRadius: '50%' }} />
                <span className="sv-title" id="sv-label">{svContent.label}</span>
              </div>
              <div
                id="sv-code"
                className={`sv-code${svFading ? ' fade' : ''}`}
                dangerouslySetInnerHTML={{ __html: svContent.code }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="container">
          <div className="sh rv" style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
            <div className="sh-eye">Pricing</div>
            <div className="sh-title" style={{ fontSize: 'clamp(32px,4vw,52px)' }}>
              Simple, <em>transparent</em> pricing.
            </div>
            <p className="sh-body" style={{ margin: '14px auto 0', textAlign: 'center' }}>
              Start free. Scale when you&apos;re ready. No hidden fees.
            </p>
          </div>

          <div className="pricing-wrap rv">
            {/* Free */}
            <div className="plan">
              <div className="plan-name">Free</div>
              <div className="plan-price">$0</div>
              <div className="plan-mo">per month · forever</div>
              <div className="plan-div" />
              <ul className="plan-feats">
                <li>100 screenshots / month</li>
                <li>1280×800 default viewport</li>
                <li>PNG output</li>
                <li>Community support</li>
              </ul>
              <a href="/signup" className="plan-btn">Get started free</a>
            </div>

            {/* Starter */}
            <div className="plan plan-hl">
              <div className="plan-badge">MOST POPULAR</div>
              <div className="plan-name">Starter</div>
              <div className="plan-price">$9</div>
              <div className="plan-mo">per month</div>
              <div className="plan-div" />
              <ul className="plan-feats">
                <li>2,000 screenshots / month</li>
                <li>All viewport sizes</li>
                <li>PNG + JPEG output</li>
                <li>Full-page capture</li>
                <li>Email support</li>
              </ul>
              <a href="/signup?plan=starter" className="plan-btn">Start Starter</a>
            </div>

            {/* Pro */}
            <div className="plan">
              <div className="plan-name">Pro</div>
              <div className="plan-price">$49</div>
              <div className="plan-mo">per month</div>
              <div className="plan-div" />
              <ul className="plan-feats">
                <li>20,000 screenshots / month</li>
                <li>Priority queue</li>
                <li>All output formats</li>
                <li>Custom headers & cookies</li>
                <li>Slack support</li>
              </ul>
              <a href="/signup?plan=pro" className="plan-btn">Start Pro</a>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <div className="testi-section">
        <div className="testi-inner rv">
          <div className="testi-stars">★★★★★</div>
          <blockquote className="testi-quote">
            &ldquo;We replaced a 200-line Puppeteer setup with three lines of Pixnab. It just works.&rdquo;
          </blockquote>
          <div className="testi-attr">— Sarah K., Senior Engineer at Relay</div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section">
        <div className="cta-inner rv">
          <h2 className="cta-title">Start taking<br /><em>screenshots</em><br />right now.</h2>
          <p className="cta-sub">100 free credits. No credit card. No nonsense.<br />Ship in minutes, not hours.</p>
          <a href="/signup" className="cta-btn">
            Get your free API key →
          </a>
          <p className="cta-note">Free forever · No credit card · Cancel anytime</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <a href="#" className="f-logo">Pixnab</a>
        <ul className="f-links">
          <li><a href="/docs">Docs</a></li>
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/terms">Terms</a></li>
          <li><a href="mailto:hi@pixnab.dev">Contact</a></li>
        </ul>
        <span className="f-copy">© 2025 Pixnab. All rights reserved.</span>
      </footer>
    </>
  );
}
