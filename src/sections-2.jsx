// ============ Sections 2: Color, Typography, Voice ============

function Swatch({ color, dark }) {
  return (
    <div className="swatch" onClick={() => window.copyText(color.hex, color.hex)} title={`Copiar ${color.hex}`}>
      <div className="chip" style={{background: color.hex, color: dark ? "#0E1B2C" : "#fff"}}>
        <div>
          <div className="pct">{color.role}</div>
          <div className="name" style={{color: dark ? "#0E1B2C" : "#fff"}}>{color.name}</div>
        </div>
      </div>
      <div className="body-info">
        <div className="row"><span>HEX</span><span>{color.hex}</span></div>
        <div className="row"><span>RGB</span><span>{color.rgb}</span></div>
        <div className="row"><span>CMYK</span><span>{color.cmyk}</span></div>
        {color.use ? (<div style={{fontSize:11.5,color:"var(--mute)",marginTop:6,lineHeight:1.5}}>{color.use}</div>) : null}
      </div>
    </div>
  );
}

function ColorSection() {
  return (
    <section id="color" className="block" data-screen-label="03 Color">
      <div className="inner">
        <div className="section-head">
          <div>
            <div className="num">03 / Color</div>
            <h2>Una paleta<br/>con tres voces.</h2>
          </div>
          <p className="lead">
            Construida desde el azul del logotipo. Aplique la regla <strong>60-30-10</strong>: azul
            como atmósfera, tinta profunda como autoridad, coral como acento de conversión.
            Click sobre cualquier muestra para copiar el HEX.
          </p>
        </div>

        <div className="eyebrow" style={{marginBottom:18}}>Primarios — la marca</div>
        <div className="grid-3" style={{marginBottom:40}}>
          {COLORS.primary.map(c => (
            <Swatch key={c.hex} color={c} dark={c.hex === "#F4F2EC"} />
          ))}
        </div>

        <div className="eyebrow" style={{marginBottom:18}}>Acentos y verticales</div>
        <div className="grid-3" style={{marginBottom:40}}>
          {COLORS.accent.map(c => <Swatch key={c.hex} color={c} />)}
        </div>

        <div className="eyebrow" style={{marginBottom:18}}>Neutros utilitarios</div>
        <div className="grid-4" style={{marginBottom:48}}>
          {COLORS.neutrals.map(c => (
            <div key={c.hex} className="swatch" onClick={() => window.copyText(c.hex, c.hex)} style={{cursor:"pointer"}}>
              <div className="chip" style={{background:c.hex,aspectRatio:"2/1",color: ["#FBFAF6","#E8E5DD"].includes(c.hex) ? "#0E1B2C" : "#fff"}}>
                <div>
                  <div className="name" style={{fontSize:14, color: ["#FBFAF6","#E8E5DD"].includes(c.hex) ? "#0E1B2C" : "#fff"}}>{c.name}</div>
                </div>
              </div>
              <div className="body-info">
                <div className="row"><span>HEX</span><span>{c.hex}</span></div>
                <div className="row"><span>RGB</span><span>{c.rgb}</span></div>
              </div>
            </div>
          ))}
        </div>

        <div className="eyebrow" style={{marginBottom:18}}>Regla 60·30·10 en acción</div>
        <div className="grid-2" style={{marginBottom:40}}>
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"18px 22px",borderBottom:"1px solid var(--line)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span className="h4">Material corporativo</span>
              <span className="pill blue">Implementación</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"6fr 3fr 1fr",height:90}}>
              <div style={{background:"#FBFAF6",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--mute)"}}>60 · Paper</div>
              <div style={{background:"#0E1B2C",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>30 · Deep Ink</div>
              <div style={{background:"#2D88E8",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>10</div>
            </div>
            <div style={{padding:"16px 22px",fontSize:13,color:"var(--mute)",lineHeight:1.55}}>
              Tinta profunda + papel cálido + acentos azules. Lectura ejecutiva, gravitas técnica, espacios blancos generosos para CFOs y directores.
            </div>
          </div>
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"18px 22px",borderBottom:"1px solid var(--line)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span className="h4">Material crecimiento</span>
              <span className="pill" style={{background:"rgba(255,107,71,.12)",color:"#c64422",border:"none"}}>Ventas · Pro Services</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"6fr 3fr 1fr",height:90}}>
              <div style={{background:"#FBFAF6",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--mute)"}}>60 · Paper</div>
              <div style={{background:"#2D88E8",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>30 · ai Blue</div>
              <div style={{background:"#FF6B47",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>10</div>
            </div>
            <div style={{padding:"16px 22px",fontSize:13,color:"var(--mute)",lineHeight:1.55}}>
              Azul de marca como atmósfera, coral solo en CTAs y métricas clave. Energía, movimiento, urgencia útil para profesionales que quieren cerrar más.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Typography ---
function TypeSection() {
  return (
    <section id="type" className="block" data-screen-label="04 Tipografia">
      <div className="inner">
        <div className="section-head">
          <div>
            <div className="num">04 / Tipografía</div>
            <h2>Vanguardia<br/>extremadamente legible.</h2>
          </div>
          <p className="lead">
            Dos sans-serif contemporáneas, una mono técnica. La tipografía hace el trabajo
            silencioso de transmitir autoridad técnica sin sacrificar la legibilidad de
            manuales largos y propuestas comerciales.
          </p>
        </div>

        <div className="grid-2" style={{marginBottom:24}}>
          <div className="specimen">
            <div className="eyebrow" style={{marginBottom:10}}>Primaria · Display</div>
            <div className="display glyphs" style={{fontFamily:"'Space Grotesk',sans-serif"}}>Aa</div>
            <div className="display" style={{fontSize:32,marginBottom:8}}>{FONTS.display.name}</div>
            <div className="mono" style={{fontSize:12,color:"var(--mute)",marginBottom:14}}>{FONTS.display.role}</div>
            <p className="body" style={{fontSize:13.5}}>{FONTS.display.why}</p>
            <div className="weight-row">
              {FONTS.display.weights.map(w => <span key={w}>{w}</span>)}
            </div>
            <p className="sample-text" style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:22,letterSpacing:"-0.02em",lineHeight:1.2,fontWeight:600,color:"var(--ink)"}}>{FONTS.display.sample}</p>
          </div>

          <div className="specimen">
            <div className="eyebrow" style={{marginBottom:10}}>Secundaria · Body</div>
            <div className="glyphs" style={{fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>Aa</div>
            <div className="display" style={{fontSize:32,marginBottom:8}}>{FONTS.body.name}</div>
            <div className="mono" style={{fontSize:12,color:"var(--mute)",marginBottom:14}}>{FONTS.body.role}</div>
            <p className="body" style={{fontSize:13.5}}>{FONTS.body.why}</p>
            <div className="weight-row">
              {FONTS.body.weights.map(w => <span key={w}>{w}</span>)}
            </div>
            <p className="sample-text" style={{fontFamily:"'DM Sans',sans-serif"}}>{FONTS.body.sample}</p>
          </div>
        </div>

        <div className="grid-2" style={{marginBottom:48}}>
          <div className="specimen">
            <div className="eyebrow" style={{marginBottom:10}}>Auxiliar · Mono</div>
            <div className="mono glyphs" style={{fontSize:64}}>Aa</div>
            <div className="display" style={{fontSize:28,marginBottom:8}}>{FONTS.mono.name}</div>
            <div className="mono" style={{fontSize:12,color:"var(--mute)",marginBottom:14}}>{FONTS.mono.role}</div>
            <p className="body" style={{fontSize:13.5}}>{FONTS.mono.why}</p>
            <div className="weight-row">
              {FONTS.mono.weights.map(w => <span key={w}>{w}</span>)}
            </div>
            <p className="sample-text mono" style={{background:"var(--ink)",color:"#9bdcff",padding:"12px 14px",borderRadius:8,fontSize:13}}>{FONTS.mono.sample}</p>
          </div>

          <div className="specimen" style={{background:"var(--ink)",color:"#e7eef7",borderColor:"var(--ink)"}}>
            <div className="eyebrow" style={{marginBottom:12,color:"#9eb2c9"}}>Escala tipográfica</div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {[
                { tag: "H1 · Display", size: 56, weight: 600, font: "Space Grotesk", text: "Acelere su crecimiento" },
                { tag: "H2 · Section", size: 36, weight: 600, font: "Space Grotesk", text: "Ecosistemas de IA aplicada" },
                { tag: "H3 · Subhead", size: 22, weight: 600, font: "Space Grotesk", text: "Implementación · Ventas · Educación" },
                { tag: "Body · 15", size: 15, weight: 400, font: "DM Sans", text: "Cuerpo de texto para temarios y propuestas." },
                { tag: "Caption · 12 mono", size: 12, weight: 500, font: "JetBrains Mono", text: "ROI · KPI · CAC · LTV · TTM" },
              ].map(r => (
                <div key={r.tag} style={{borderBottom:"1px solid #1f2d42",paddingBottom:10}}>
                  <div className="mono" style={{fontSize:10,color:"#9eb2c9",letterSpacing:".1em",marginBottom:4,textTransform:"uppercase"}}>{r.tag}</div>
                  <div style={{fontFamily:r.font + ",sans-serif",fontSize:r.size,fontWeight:r.weight,letterSpacing:r.size > 30 ? "-0.02em" : "0",lineHeight:1.15}}>{r.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Voice ---
function VoiceSection() {
  const [active, setActive] = useState("ceo");
  const profile = VOICE_PROFILES.find(p => p.id === active);
  return (
    <section id="voice" className="block" data-screen-label="05 Voz">
      <div className="inner">
        <div className="section-head">
          <div>
            <div className="num">05 / Voz y tono</div>
            <h2>Mismo cerebro,<br/>tres voces.</h2>
          </div>
          <p className="lead">
            aiLearning habla con autoridad técnica, agilidad de crecimiento y claridad
            pedagógica. La <strong>voz</strong> (lo que somos) no cambia. El <strong>tono</strong>
            sí — se ajusta al interlocutor. Cambie de perfil para ver cada matiz.
          </p>
        </div>

        <div className="voice-tabs">
          {VOICE_PROFILES.map(p => (
            <button key={p.id} onClick={() => setActive(p.id)} className={active === p.id ? "active" : ""}>
              <span className="dot" style={{background:p.color}}></span>
              {p.audience}
            </button>
          ))}
        </div>

        <div className="voice-card" key={profile.id}>
          <div className="header">
            <div>
              <h3>{profile.audience}</h3>
              <div className="mono" style={{fontSize:12,color:"var(--mute)",marginTop:6,letterSpacing:".06em"}}>Objetivo: {profile.objective}</div>
            </div>
            <span className="pill" style={{background:profile.color,color:"#fff",border:"none"}}>{profile.id.toUpperCase()}</span>
          </div>

          <div className="quote">{profile.quote}</div>

          <div className="props">
            <div className="col">
              <div className="label">Cómo sí · Do</div>
              <ul>
                {profile.do.map(d => <li key={d}>{d}</li>)}
              </ul>
            </div>
            <div className="col">
              <div className="label">Cómo no · Don't</div>
              <ul className="dont" style={{listStyle:"none",display:"flex",flexDirection:"column",gap:6}}>
                {profile.dont.map(d => (
                  <li key={d} style={{fontSize:13.5,color:"var(--ink-2)",paddingLeft:18,position:"relative"}}>
                    <span style={{position:"absolute",left:0,top:8,width:8,height:1.5,background:"var(--coral)"}}></span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{marginTop:24,paddingTop:18,borderTop:"1px solid var(--line)"}}>
            <div className="label" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:".1em",color:"var(--mute)",textTransform:"uppercase",marginBottom:8}}>Muestra de copy · CTA / hero</div>
            <p className="display" style={{fontSize:20,letterSpacing:"-0.015em",color:"var(--ink)"}}>{profile.sample}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Swatch, ColorSection, TypeSection, VoiceSection });
