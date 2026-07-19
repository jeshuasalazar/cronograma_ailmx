// ============ Sections 1: Cover, Essence, Logo ============
const { useState, useEffect, useRef } = React;

function showToast(msg = "Copiado al portapapeles") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toastT);
  window.__toastT = setTimeout(() => t.classList.remove("show"), 1400);
}
function copyText(text, label) {
  navigator.clipboard?.writeText(text);
  showToast(label ? `Copiado · ${label}` : "Copiado");
}
window.copyText = copyText;

// --- Cover ---
function Cover() {
  return (
    <section id="cover" className="cover block" data-screen-label="00 Portada">
      <div className="cover-inner">
        <div className="cover-left">
          <div>
            <div className="eyebrow" style={{marginBottom:24}}>Brand Manual · Versión 1.0 · 2026</div>
            <h1 className="display">
              Catalizar<br/>el siguiente<br/><em>orden</em> de<br/>magnitud.
            </h1>
            <p className="tagline">
              Manual de Identidad de Marca para aiLearning Innovación y Desarrollo
              Educativo. Una guía operativa para escalar negocios con inteligencia
              artificial — sin perder claridad pedagógica.
            </p>
          </div>
          <div className="meta-grid">
            <div>
              <div className="label">Cliente</div>
              <div>aiLearning SAS</div>
            </div>
            <div>
              <div className="label">Sector</div>
              <div>Consultoría · IA aplicada</div>
            </div>
            <div>
              <div className="label">Documento</div>
              <div>Brand Kit & Voz</div>
            </div>
          </div>
        </div>
        <div className="cover-right">
          <div className="footer-r">aiLearning ®</div>
          <div className="logo-stage">
            <img src="assets/logo-lockup.png" alt="aiLearning lockup" />
          </div>
          <div className="footer-r" style={{display:"flex",justifyContent:"space-between"}}>
            <span>Innovación · Educación</span>
            <span>BK · 01 / 09</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Essence ---
function Essence() {
  return (
    <section id="essence" className="block" data-screen-label="01 Esencia">
      <div className="inner">
        <div className="section-head">
          <div>
            <div className="num">01 / Esencia</div>
            <h2>Lo que somos,<br/>antes de cómo lo decimos.</h2>
          </div>
          <p className="lead">
            La esencia de aiLearning vive en tres movimientos: <strong>digitalizar</strong>,
            <strong> escalar</strong> y <strong>enseñar</strong>. Cada artefacto de marca
            existe para llevar a un cliente o estudiante un paso más cerca del cierre,
            del lanzamiento o del entendimiento.
          </p>
        </div>

        <div className="grid-2" style={{marginBottom:48}}>
          <div className="card">
            <div className="eyebrow" style={{marginBottom:10}}>Misión</div>
            <p className="h3">Acelerar y escalar negocios con ecosistemas de IA que producen ventas, contratos y aprendizaje medibles.</p>
          </div>
          <div className="card dark">
            <div className="eyebrow" style={{marginBottom:10,color:"#9eb2c9"}}>Promesa</div>
            <p className="h3">Cada implementación deja al cliente con una operación más rápida, un equipo más capaz y un siguiente paso claro.</p>
          </div>
        </div>

        <div className="eyebrow" style={{marginBottom:18}}>Personalidad · 4 ejes</div>
        <div className="grid-4">
          {PERSONALITY.map((p, i) => (
            <div key={p.word} className="card" style={{display:"flex",flexDirection:"column",gap:10,minHeight:170}}>
              <div className="mono" style={{fontSize:11,color:"var(--ai-blue)",letterSpacing:".1em"}}>0{i+1}</div>
              <div className="h3" style={{fontSize:20}}>{p.word}</div>
              <p className="body" style={{fontSize:13.5}}>{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="card" style={{marginTop:40,background:"var(--ai-blue-soft)",border:"none"}}>
          <div className="eyebrow" style={{marginBottom:10,color:"var(--ai-blue-deep)"}}>Posicionamiento en una frase</div>
          <p className="display" style={{fontSize:32,letterSpacing:"-0.02em",color:"var(--ink)"}}>
            La consultoría de crecimiento con IA que <span style={{color:"var(--ai-blue)"}}>implementa, vende y enseña</span> con el mismo rigor.
          </p>
        </div>
      </div>
    </section>
  );
}

// --- Logo ---
function LogoSection() {
  return (
    <section id="logo" className="block" data-screen-label="02 Logo">
      <div className="inner">
        <div className="section-head">
          <div>
            <div className="num">02 / Logotipo</div>
            <h2>Un símbolo,<br/>tres expresiones.</h2>
          </div>
          <p className="lead">
            El símbolo "ai" inscrito en una forma conversacional — el aprendizaje y la
            inteligencia artificial dialogando. Úselo en la versión que mejor sirva al
            contexto, nunca recrease ni se altere su geometría.
          </p>
        </div>

        <div className="eyebrow" style={{marginBottom:18}}>Versiones autorizadas</div>
        <div className="grid-3" style={{marginBottom:48}}>
          <div className="logo-card">
            <div className="tag">Lockup vertical · Principal</div>
            <img src="assets/logo-lockup.png" alt="lockup" />
          </div>
          <div className="logo-card cloud">
            <div className="tag">Símbolo · Mark</div>
            <img src="assets/logo-mark.png" alt="mark" />
          </div>
          <div className="logo-card">
            <div className="tag">Wordmark</div>
            <img src="assets/logo-wordmark.png" alt="wordmark" />
          </div>
          <div className="logo-card dark">
            <div className="tag">Sobre fondo oscuro</div>
            <img src="assets/logo-lockup.png" alt="lockup-dark" />
          </div>
          <div className="logo-card blue">
            <div className="tag">Sobre fondo marca</div>
            <img src="assets/logo-lockup.png" alt="lockup-blue" className="invert" />
          </div>
          <div className="logo-card" style={{background:"var(--cloud)"}}>
            <div className="tag">Reverso · Outline</div>
            <img src="assets/logo-mark.png" alt="outline" style={{filter:"grayscale(1) opacity(.85)"}} />
          </div>
        </div>

        <div className="grid-2" style={{marginBottom:48}}>
          <div>
            <div className="eyebrow" style={{marginBottom:12}}>Espacio de seguridad</div>
            <p className="body" style={{marginBottom:18}}>
              Reserve siempre un margen igual a la altura del símbolo "ai" (x) en
              los cuatro lados del lockup. Este aire es no negociable: protege la
              legibilidad y la jerarquía visual frente a otros elementos.
            </p>
            <div className="clearspace">
              <div className="cs-stage">
                <div className="cs-grid"></div>
                <img src="assets/logo-lockup.png" alt="clearspace" />
              </div>
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{marginBottom:12}}>Tamaños mínimos</div>
            <p className="body" style={{marginBottom:18}}>
              Para garantizar la legibilidad de "LEARNING" y la nitidez del símbolo,
              respete las dimensiones mínimas. Por debajo, use solo el símbolo.
            </p>
            <div className="card" style={{display:"flex",flexDirection:"column",gap:18}}>
              <div style={{display:"flex",alignItems:"center",gap:18,paddingBottom:14,borderBottom:"1px solid var(--line)"}}>
                <img src="assets/logo-lockup.png" style={{width:96,height:96,objectFit:"contain"}} alt="" />
                <div>
                  <div className="h4">Digital</div>
                  <div className="mono" style={{fontSize:12,color:"var(--mute)"}}>96 px · lockup · 32 px · símbolo</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:18,paddingBottom:14,borderBottom:"1px solid var(--line)"}}>
                <img src="assets/logo-lockup.png" style={{width:64,height:64,objectFit:"contain"}} alt="" />
                <div>
                  <div className="h4">Impresión</div>
                  <div className="mono" style={{fontSize:12,color:"var(--mute)"}}>25 mm · lockup · 10 mm · símbolo</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:18}}>
                <img src="assets/logo-mark.png" style={{width:32,height:32,objectFit:"contain"}} alt="" />
                <div>
                  <div className="h4">Favicon / app</div>
                  <div className="mono" style={{fontSize:12,color:"var(--mute)"}}>16 px mínimo · solo símbolo</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="eyebrow" style={{marginBottom:18}}>Usos incorrectos</div>
        <div className="misuse-grid">
          <div className="misuse">
            <div className="x-mark">×</div>
            <img src="assets/logo-mark.png" style={{transform:"scaleX(1.5)"}} alt="" />
            <div className="caption">No deforme las proporciones</div>
          </div>
          <div className="misuse" style={{background:"linear-gradient(135deg,#ff0080,#7928ca)"}}>
            <div className="x-mark">×</div>
            <img src="assets/logo-lockup.png" alt="" />
            <div className="caption" style={{color:"#fff"}}>No use sobre fondos ruidosos</div>
          </div>
          <div className="misuse">
            <div className="x-mark">×</div>
            <img src="assets/logo-mark.png" style={{filter:"hue-rotate(120deg)"}} alt="" />
            <div className="caption">No altere el color del símbolo</div>
          </div>
          <div className="misuse">
            <div className="x-mark">×</div>
            <img src="assets/logo-lockup.png" style={{transform:"rotate(-12deg)"}} alt="" />
            <div className="caption">No rote ni incline el lockup</div>
          </div>
          <div className="misuse" style={{background:"#fff"}}>
            <div className="x-mark">×</div>
            <img src="assets/logo-mark.png" style={{filter:"blur(2px)"}} alt="" />
            <div className="caption">No aplique efectos, sombras ni blur</div>
          </div>
          <div className="misuse">
            <div className="x-mark">×</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <img src="assets/logo-mark.png" style={{width:50}} alt="" />
              <span style={{fontFamily:"'Comic Sans MS',cursive",fontSize:18,color:"var(--ai-blue)"}}>Learning</span>
            </div>
            <div className="caption">No sustituya el wordmark</div>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Cover, Essence, LogoSection });
