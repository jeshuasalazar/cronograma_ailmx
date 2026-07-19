// ============ App shell + sticky nav + scroll spy ============
function App() {
  const [active, setActive] = useState("cover");

  useEffect(() => {
    const ids = NAV.map(n => n.id);
    const els = ids.map(id => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      // Find the entry closest to the top of viewport that is intersecting
      const visible = entries.filter(e => e.isIntersecting);
      if (visible.length > 0) {
        // pick the one with the smallest top
        visible.sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = visible[0].target.id;
        setActive(id);
      }
    }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const onNavClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop, behavior: "smooth" });
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand-tag">
          <img src="assets/logo-mark.png" alt="ai" />
          <div>
            <div className="name">aiLearning</div>
            <div className="sub">Brand Manual</div>
          </div>
        </div>
        <nav className="nav">
          {NAV.map(item => (
            <a key={item.id} href={"#" + item.id} onClick={(e) => onNavClick(e, item.id)} className={active === item.id ? "active" : ""}>
              <span>{item.label}</span>
              <span className="n">{item.n}</span>
            </a>
          ))}
        </nav>
        <div className="meta">
          v1.0 · 05.2026<br/>
          Click en cualquier color para copiar
        </div>
      </aside>

      <main className="main">
        <Cover />
        <Essence />
        <LogoSection />
        <ColorSection />
        <TypeSection />
        <VoiceSection />
        <SignatureSection />
        <DocsSection />
        <ImagerySection />
        <PromptSection />
        <Footer />
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
