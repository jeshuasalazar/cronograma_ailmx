// ============ Sections 3: Signature, Docs, Imagery, Prompt ============

// --- Email Signature ---
const SIG_VARIANTS = [
  {
    id: "corp",
    label: "Corporativo",
    desc: "Para implementaciones, propuestas a director general y comunicación enterprise. Sobrio, con border azul vertical y CTA de diagnóstico.",
    accent: "#2D88E8",
    preset: { name:"Jeshua Salazar", role:"Co-founder & Director de Tecnología", phone:"+52 55 1013 2847", cta:"¿Listo para escalar con IA? Agende un diagnóstico de 30 min →", ctaUrl:"https://www.ailearning.mx/diagnostico" },
    render: ({name, role, phone, logoUrl, cta, ctaUrl}) => `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:#0E1B2C;font-size:13px;line-height:1.5">
  <tr>
    <td style="vertical-align:top;padding-right:18px;border-right:2px solid #2D88E8">
      <img src="${logoUrl}" width="56" height="56" alt="aiLearning" style="display:block"/>
    </td>
    <td style="vertical-align:top;padding-left:18px">
      <div style="font-weight:700;font-size:15px;color:#0E1B2C">${name}</div>
      <div style="color:#6B7484;font-size:12px;margin-bottom:8px">${role} &middot; aiLearning</div>
      <div style="font-size:12px;color:#1F2D42">
        <a href="tel:${phone.replace(/\s/g,'')}" style="color:#1F2D42;text-decoration:none">${phone}</a> &middot;
        <a href="https://www.ailearning.mx" style="color:#2D88E8;text-decoration:none;font-weight:600">ailearning.mx</a>
      </div>
      <div style="margin-top:10px;padding:8px 12px;background:#E6F0FB;border-left:3px solid #2D88E8;font-size:11.5px;color:#1A5FB4">
        <a href="${ctaUrl}" style="color:#1A5FB4;text-decoration:none"><strong>${cta}</strong></a>
      </div>
    </td>
  </tr>
</table>`
  },
  {
    id: "growth",
    label: "Comercial · Growth",
    desc: "Para equipo de ventas y profesionales de servicios. CTA en bloque sólido coral, foco en agendar demos y cerrar contratos.",
    accent: "#FF6B47",
    preset: { name:"Jeshua Salazar", role:"Co-founder & Director de Tecnología", phone:"+52 55 1013 2847", cta:"Reserve una demo de 20 min", ctaUrl:"https://www.ailearning.mx/demo" },
    render: ({name, role, phone, logoUrl, cta, ctaUrl}) => `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:#0E1B2C;font-size:13px;line-height:1.5">
  <tr>
    <td style="vertical-align:top;padding-right:16px">
      <img src="${logoUrl}" width="48" height="48" alt="aiLearning" style="display:block"/>
    </td>
    <td style="vertical-align:top">
      <div style="font-weight:700;font-size:15px;color:#0E1B2C">${name}</div>
      <div style="color:#FF6B47;font-size:12px;font-weight:600;margin-bottom:6px">${role} &middot; aiLearning</div>
      <div style="font-size:12px;color:#6B7484;margin-bottom:12px">${phone} &middot; <a href="https://www.ailearning.mx" style="color:#2D88E8;text-decoration:none">ailearning.mx</a></div>
      <a href="${ctaUrl}" style="display:inline-block;background:#FF6B47;color:#fff;font-size:12px;font-weight:600;padding:9px 16px;border-radius:6px;text-decoration:none">${cta} &rarr;</a>
    </td>
  </tr>
</table>`
  },
  {
    id: "edu",
    label: "Educativo",
    desc: "Para instructores y equipo académico. Tono cálido, paleta sage, CTA hacia próximas cohortes o materiales del curso.",
    accent: "#6B9080",
    preset: { name:"Jeshua Salazar", role:"Co-founder & Director de Tecnología", phone:"+52 55 1013 2847", cta:"Próxima cohorte abierta · ver programa", ctaUrl:"https://www.ailearning.mx/cohorte" },
    render: ({name, role, phone, logoUrl, cta, ctaUrl}) => `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:#0E1B2C;font-size:13px;line-height:1.5">
  <tr>
    <td style="vertical-align:top;padding-right:18px">
      <img src="${logoUrl}" width="52" height="52" alt="aiLearning" style="display:block"/>
    </td>
    <td style="vertical-align:top;padding-left:0">
      <div style="font-weight:700;font-size:15px;color:#0E1B2C">${name}</div>
      <div style="color:#6B7484;font-size:12px;margin-bottom:10px">${role}</div>
      <div style="font-size:11.5px;color:#1F2D42;margin-bottom:10px">
        <a href="tel:${phone.replace(/\s/g,'')}" style="color:#1F2D42;text-decoration:none">${phone}</a> &middot;
        <a href="https://www.ailearning.mx" style="color:#2D88E8;text-decoration:none">ailearning.mx</a>
      </div>
      <div style="font-size:11px;color:#6B9080;border-top:1px solid #E8E5DD;padding-top:10px;font-family:'Courier New',monospace;letter-spacing:0.04em;text-transform:uppercase">
        <a href="${ctaUrl}" style="color:#6B9080;text-decoration:none">&#9656; ${cta}</a>
      </div>
    </td>
  </tr>
</table>`
  },
  {
    id: "min",
    label: "Minimalista",
    desc: "Para respuestas en hilo, comunicaciones internas o cuando la firma corporativa satura. Sin imagen, una línea, máxima señal.",
    accent: "#0E1B2C",
    preset: { name:"Jeshua Salazar", role:"Co-founder & Director de Tecnología", phone:"+52 55 1013 2847", cta:"ailearning.mx", ctaUrl:"https://www.ailearning.mx" },
    render: ({name, role, phone, cta, ctaUrl}) => `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:#0E1B2C;font-size:13px;line-height:1.5">
  <tr>
    <td>
      <div style="font-weight:700;font-size:13px;color:#0E1B2C">${name} &middot; <span style="color:#6B7484;font-weight:400">${role}</span></div>
      <div style="font-size:12px;color:#6B7484;margin-top:2px">aiLearning &middot; ${phone} &middot; <a href="${ctaUrl}" style="color:#2D88E8;text-decoration:none">${cta}</a></div>
    </td>
  </tr>
</table>`
  },
  {
    id: "event",
    label: "Evento · Lanzamiento",
    desc: "Firma temporal para eventos, conferencias o lanzamientos de producto. Banner inferior con info del evento y fecha. Reemplazar al cierre.",
    accent: "#1A5FB4",
    preset: { name:"Jeshua Salazar", role:"Co-founder & Director de Tecnología", phone:"+52 55 1013 2847", cta:"AI STACK SUMMIT · 12 OCT · CDMX · Cupos limitados", ctaUrl:"https://www.ailearning.mx/summit" },
    render: ({name, role, phone, logoUrl, cta, ctaUrl}) => `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:#0E1B2C;font-size:13px;line-height:1.5">
  <tr>
    <td style="vertical-align:top;padding-right:18px;border-right:2px solid #2D88E8">
      <img src="${logoUrl}" width="56" height="56" alt="aiLearning" style="display:block"/>
    </td>
    <td style="vertical-align:top;padding-left:18px">
      <div style="font-weight:700;font-size:15px;color:#0E1B2C">${name}</div>
      <div style="color:#6B7484;font-size:12px;margin-bottom:8px">${role} &middot; aiLearning</div>
      <div style="font-size:12px;color:#1F2D42;margin-bottom:10px">${phone} &middot; <a href="https://www.ailearning.mx" style="color:#2D88E8;text-decoration:none;font-weight:600">ailearning.mx</a></div>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding-top:14px">
      <a href="${ctaUrl}" style="display:block;background:#0E1B2C;color:#fff;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.1em;padding:12px 16px;border-radius:8px;text-decoration:none;text-align:center"><span style="color:#FF6B47">&#9632;</span> ${cta} &rarr;</a>
    </td>
  </tr>
</table>`
  }
];

function SignatureSection() {
  const [variantId, setVariantId] = useState("corp");
  const variant = SIG_VARIANTS.find(v => v.id === variantId);
  const [name, setName] = useState(variant.preset.name);
  const [role, setRole] = useState(variant.preset.role);
  const [phone, setPhone] = useState(variant.preset.phone);
  const [cta, setCta]   = useState(variant.preset.cta);

  // When variant changes, reset fields to that variant's preset
  useEffect(() => {
    setName(variant.preset.name);
    setRole(variant.preset.role);
    setPhone(variant.preset.phone);
    setCta(variant.preset.cta);
  }, [variantId]);

  const logoUrl = window.location.origin + window.location.pathname.replace(/[^/]+$/, "") + "assets/logo-mark.png";
  const html = variant.render({ name, role, phone, logoUrl, cta, ctaUrl: variant.preset.ctaUrl });

  return (
    <section id="signature" className="block" data-screen-label="06 Firma">
      <div className="inner">
        <div className="section-head">
          <div>
            <div className="num">06 / Firma de correo</div>
            <h2>Cinco firmas,<br/>un mismo sistema.</h2>
          </div>
          <p className="lead">
            Una matriz de firmas HTML según el caso de uso: corporativa, growth, educativa,
            minimalista y eventos. Comparten geometría y paleta — cambian acento, jerarquía
            y CTA. Edite los campos en vivo y copie el HTML para Gmail u Outlook.
          </p>
        </div>

        <div className="voice-tabs" style={{marginBottom:24}}>
          {SIG_VARIANTS.map(v => (
            <button key={v.id} onClick={()=>setVariantId(v.id)} className={variantId === v.id ? "active" : ""}>
              <span className="dot" style={{background:v.accent}}></span>
              {v.label}
            </button>
          ))}
        </div>

        <div className="card" style={{marginBottom:20,display:"flex",gap:14,alignItems:"flex-start"}}>
          <span className="pill" style={{background:variant.accent,color:"#fff",border:"none",flexShrink:0,marginTop:2}}>{variant.label}</span>
          <p className="body" style={{fontSize:13.5,margin:0}}>{variant.desc}</p>
        </div>

        <div className="grid-4" style={{marginBottom:24,gap:12}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre" className="mono" style={inpStyle}/>
          <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Cargo" className="mono" style={inpStyle}/>
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Teléfono" className="mono" style={inpStyle}/>
          <input value={cta} onChange={e=>setCta(e.target.value)} placeholder="CTA" className="mono" style={inpStyle}/>
        </div>

        <div className="sig-shell">
          <div className="preview">
            <div className="eyebrow" style={{marginBottom:14}}>Vista previa · Cliente de correo</div>
            <div className="sig-render" dangerouslySetInnerHTML={{__html: html}}></div>
            <div style={{marginTop:24,padding:14,background:"var(--cloud)",borderRadius:10,fontSize:12,color:"var(--mute)",lineHeight:1.55}}>
              <strong style={{color:"var(--ink)"}}>Reglas comunes:</strong> Sin emojis. Logo &lt; 60 kb. Una sola CTA. Azul de marca reservado a links y CTAs principales. La firma debe sobrevivir en blanco y negro y en lectura móvil. No mezcle variantes en un mismo hilo.
            </div>
          </div>
          <div className="code">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div className="eyebrow">Código · HTML</div>
              <button className="btn" onClick={()=>window.copyText(html, "HTML " + variant.label)}>Copiar HTML</button>
            </div>
            <pre>{html}</pre>
          </div>
        </div>

        <div className="grid-2" style={{marginTop:40}}>
          <div className="card">
            <div className="eyebrow" style={{marginBottom:8}}>Cuándo usar cuál</div>
            <p className="body" style={{fontSize:13}}><strong>Corporativo</strong> · trato con C-level y áreas de TI. <strong>Growth</strong> · prospección, demo, follow-up de venta. <strong>Educativo</strong> · alumnos, instructores. <strong>Minimalista</strong> · respuestas en hilo. <strong>Evento</strong> · 2 semanas antes y durante el evento.</p>
          </div>
          <div className="card">
            <div className="eyebrow" style={{marginBottom:8}}>Compatibilidad</div>
            <p className="body" style={{fontSize:13}}>Todas las variantes están construidas en HTML de tabla, probado en Gmail web, Apple Mail, Outlook 2019+ y clientes móviles. Sin CSS externo. Sin variables. Imágenes con dimensiones explícitas para evitar reflow.</p>
          </div>
          <div className="card">
            <div className="eyebrow" style={{marginBottom:8}}>Soporte · WhatsApp</div>
            <p className="body" style={{fontSize:13}}>Para clientes activos, incluya el WhatsApp de soporte en correos de onboarding y post-venta: <a href="https://wa.me/525611976507" style={{color:"var(--ai-blue)",fontFamily:"'JetBrains Mono',monospace",textDecoration:"none"}}>+52 56 1197 6507</a>. No lo agregue como CTA principal — reserve ese espacio para diagnóstico, demo o cohorte.</p>
          </div>
          <div className="card">
            <div className="eyebrow" style={{marginBottom:8}}>Mantenimiento</div>
            <p className="body" style={{fontSize:13}}>El logo debe alojarse en un CDN propio (cloudfront, s3, supabase storage). No use el binario incrustado. Renueve la firma de evento cada trimestre. Audite links de CTA mensualmente.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const inpStyle = {
  background:"#fff",
  border:"1px solid var(--line)",
  borderRadius:8,
  padding:"10px 14px",
  fontSize:13,
  fontFamily:"'JetBrains Mono',monospace",
  color:"var(--ink)",
  outline:"none"
};

// --- Documents ---
function DocsSection() {
  const props = [
    {
      idx: "01",
      title: "Header con resumen ejecutivo en 3 métricas",
      body: "Reemplace el bloque de datos del cliente como héroe por un panel: '∆ Operación · ∆ Conversión · ROI estimado a 90 días'. El director firma con la mirada en los números, no en la marca.",
      demo: (
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,width:"100%",padding:"0 14px"}}>
          {[["−38%","Tiempo a valor"],["+24%","Conversión"],["3.4×","ROI 90 días"]].map(([n,l])=>(
            <div key={l} style={{background:"#fff",border:"1px solid var(--line-soft)",borderRadius:8,padding:"10px",textAlign:"center"}}>
              <div className="display" style={{fontSize:20,color:"var(--ai-blue)",fontWeight:600}}>{n}</div>
              <div className="mono" style={{fontSize:9,color:"var(--mute)",letterSpacing:".06em",textTransform:"uppercase"}}>{l}</div>
            </div>
          ))}
        </div>
      )
    },
    {
      idx: "02",
      title: "Línea de tiempo de implementación visible",
      body: "Cada fase con entregables, responsables y duración. Convierte una propuesta en un compromiso de ejecución. La incertidumbre es el principal asesino del cierre B2B.",
      demo: (
        <div style={{width:"100%",padding:"0 18px"}}>
          {[
            {w:"30%",l:"Diagnóstico"},
            {w:"45%",l:"Implementación"},
            {w:"25%",l:"Handover · Educación"},
          ].map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div className="mono" style={{fontSize:9,color:"var(--mute)",width:48,textTransform:"uppercase",letterSpacing:".06em"}}>S{i+1}</div>
              <div style={{height:8,width:p.w,background:i===1?"var(--ai-blue)":"var(--ink-2)",borderRadius:99}}></div>
              <div className="mono" style={{fontSize:9,color:"var(--ink-2)"}}>{p.l}</div>
            </div>
          ))}
        </div>
      )
    },
    {
      idx: "03",
      title: "Caja de inversión vs. ahorro proyectado",
      body: "Una caja lado-a-lado: 'Inversión total' contra 'Ahorro/ingreso proyectado a 12 meses'. Justifica el ROI sin palabras. Use Conversion Coral solo aquí para destacar el delta positivo.",
      demo: (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",padding:"0 14px"}}>
          <div style={{background:"#fff",border:"1px solid var(--line-soft)",borderRadius:8,padding:10}}>
            <div className="mono" style={{fontSize:9,color:"var(--mute)",textTransform:"uppercase"}}>Inversión</div>
            <div className="display" style={{fontSize:18,color:"var(--ink)",fontWeight:600}}>$ 48k</div>
          </div>
          <div style={{background:"var(--ink)",borderRadius:8,padding:10,color:"#fff"}}>
            <div className="mono" style={{fontSize:9,color:"#9eb2c9",textTransform:"uppercase"}}>Ahorro 12m</div>
            <div className="display" style={{fontSize:18,fontWeight:600,color:"var(--coral)"}}>$ 164k</div>
          </div>
        </div>
      )
    }
  ];

  const manuals = [
    {
      idx: "M1",
      title: "Sistema de capítulos con paginación tipográfica",
      body: "Cada capítulo abre con una página de respeto: número grande en Space Grotesk, una frase de marco mental, y un mini-índice. Da pausa, controla el ritmo, genera la sensación de un libro profesional.",
      demo: (
        <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",padding:14}}>
          <div style={{background:"#fff",border:"1px solid var(--line-soft)",borderRadius:6,padding:"16px 18px",textAlign:"left",width:"100%",maxWidth:200}}>
            <div className="display" style={{fontSize:42,color:"var(--ai-blue)",lineHeight:.9,fontWeight:600}}>04</div>
            <div className="mono" style={{fontSize:9,color:"var(--mute)",letterSpacing:".1em",textTransform:"uppercase",marginTop:6}}>Capítulo</div>
            <div className="display" style={{fontSize:13,marginTop:6,letterSpacing:"-0.01em"}}>Agentes autónomos en operación</div>
          </div>
        </div>
      )
    },
    {
      idx: "M2",
      title: "Margen lateral con anotaciones tipo Tufte",
      body: "Use el margen derecho para definiciones, ejemplos cortos y enlaces a recursos. Mantiene el flujo de lectura central limpio y añade densidad informativa sin saturar — señal inmediata de manual premium.",
      demo: (
        <div style={{width:"100%",padding:"0 14px"}}>
          <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:8}}>
            <div>
              <div style={{height:6,background:"var(--ink-2)",borderRadius:99,marginBottom:5}}></div>
              <div style={{height:6,background:"var(--line)",borderRadius:99,marginBottom:5}}></div>
              <div style={{height:6,background:"var(--line)",borderRadius:99,marginBottom:5,width:"80%"}}></div>
              <div style={{height:6,background:"var(--line)",borderRadius:99,width:"65%"}}></div>
            </div>
            <div style={{borderLeft:"2px solid var(--ai-blue)",paddingLeft:8}}>
              <div className="mono" style={{fontSize:8,color:"var(--ai-blue)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:3}}>Nota</div>
              <div style={{height:5,background:"var(--line)",borderRadius:99,marginBottom:3}}></div>
              <div style={{height:5,background:"var(--line)",borderRadius:99,width:"75%"}}></div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="docs" className="block" data-screen-label="07 Documentos">
      <div className="inner">
        <div className="section-head">
          <div>
            <div className="num">07 / Documentos</div>
            <h2>Propuestas que cierran.<br/>Manuales que se conservan.</h2>
          </div>
          <p className="lead">
            Tres mejoras para sus cotizaciones que justifican el ROI desde la primera
            página, y dos recomendaciones para que sus manuales y temarios se sientan
            premium — listos para imprimir y enmarcar en una oficina.
          </p>
        </div>

        <div className="eyebrow" style={{marginBottom:18}}>Propuestas comerciales · 3 mejoras</div>
        <div className="grid-3" style={{marginBottom:48}}>
          {props.map(p => (
            <div key={p.idx} className="imp-card">
              <div className="index">{p.idx} · Mejora</div>
              <div className="h3" style={{fontSize:18,lineHeight:1.25}}>{p.title}</div>
              <div className="demo">{p.demo}</div>
              <p className="body" style={{fontSize:13}}>{p.body}</p>
            </div>
          ))}
        </div>

        <div className="eyebrow" style={{marginBottom:18}}>Manuales y temarios · 2 recomendaciones</div>
        <div className="grid-2">
          {manuals.map(p => (
            <div key={p.idx} className="imp-card">
              <div className="index">{p.idx} · Premium</div>
              <div className="h3" style={{fontSize:20,lineHeight:1.25}}>{p.title}</div>
              <div className="demo" style={{height:170}}>{p.demo}</div>
              <p className="body" style={{fontSize:13.5}}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Imagery ---
function ImagerySection() {
  const styles = [
    { tex:"tex-1", label:"Arquitectura abstracta", desc:"Renders de espacios negativos y geometría limpia que sugieren sistemas escalables." },
    { tex:"tex-2", label:"Patrón de datos", desc:"Tramas y rejillas que evocan flujos, sin caer en el cliché del 'matrix verde'." },
    { tex:"tex-3", label:"Macro de materiales", desc:"Texturas reales — papel, cristal, fibra óptica — como metáfora táctil de lo digital." },
    { tex:"tex-4", label:"Luz dirigida", desc:"Fotografía de objetos cotidianos con iluminación de estudio: lo común vuelto premium." },
    { tex:"tex-5", label:"Documento en pantalla", desc:"Capturas reales de productos y dashboards del cliente — la transformación visible." },
    { tex:"tex-6", label:"Retrato editorial", desc:"Personas en su entorno de trabajo, mirada fuera de cámara, momento de pensamiento — no de selfie." },
  ];
  return (
    <section id="imagery" className="block" data-screen-label="08 Imagery">
      <div className="inner">
        <div className="section-head">
          <div>
            <div className="num">08 / Fotografía y UI</div>
            <h2>Sin manos<br/>estrechándose.</h2>
          </div>
          <p className="lead">
            La transformación digital ya no se ilustra con apretones de manos, robots
            antropomórficos o cerebros con circuitos. Use estos seis registros visuales —
            mezclados con humanidad real — para mostrar resultados, no estereotipos.
          </p>
        </div>

        <div className="grid-3" style={{marginBottom:48}}>
          {styles.map(s => (
            <div key={s.label}>
              <div className={"photo-card " + s.tex}>
                <span className="label">{s.label}</span>
              </div>
              <p className="body" style={{marginTop:12,fontSize:13}}>{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{marginBottom:24}}>
          <div className="card" style={{borderColor:"var(--ai-blue)"}}>
            <div className="eyebrow" style={{marginBottom:10,color:"var(--ai-blue)"}}>✓ Sí use</div>
            <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:8,fontSize:13.5,color:"var(--ink-2)"}}>
              <li>↗ Productos reales del cliente · dashboards, flujos, agentes en acción</li>
              <li>↗ Personas trabajando, no posando · concentración, no sonrisas vacías</li>
              <li>↗ Diagramas de arquitectura en estilo isométrico minimal</li>
              <li>↗ Tipografía como imagen · una palabra grande puede ser la portada</li>
              <li>↗ Color sólido del sistema · azul, tinta o coral, full-bleed</li>
            </ul>
          </div>
          <div className="card" style={{borderColor:"var(--coral)"}}>
            <div className="eyebrow" style={{marginBottom:10,color:"var(--coral)"}}>✗ Evite</div>
            <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:8,fontSize:13.5,color:"var(--ink-2)"}}>
              <li>↘ Apretones de manos, equipos sonriendo a cámara, "diverse stock"</li>
              <li>↘ Robots humanoides, manos azules saliendo de la pantalla</li>
              <li>↘ Cerebros con circuitos, código verde estilo Matrix</li>
              <li>↘ Mockups genéricos de laptops flotantes con curvas en degradé</li>
              <li>↘ Iconos 3D infantilizados (clipart estilo Notion / Memoji)</li>
            </ul>
          </div>
        </div>

        <div className="eyebrow" style={{marginBottom:14}}>Lenguaje de interfaz</div>
        <div className="card">
          <p className="body" style={{fontSize:14.5}}>
            Para mockups de producto y screens de IA usar: <strong>fondo oscuro #0E1B2C</strong> con
            texto crudo en JetBrains Mono cuando se muestra el "behind the scenes" del agente, y
            <strong> fondo claro #FBFAF6</strong> con DM Sans cuando se muestra la cara del cliente.
            Esta dualidad refuerza la promesa: complejidad técnica que produce simplicidad para el usuario.
          </p>
        </div>
      </div>
    </section>
  );
}

// --- System Prompt ---
function PromptSection() {
  const prompt = `Eres el agente operativo de aiLearning — la consultoría de crecimiento con IA que digitaliza procesos, escala ventas y enseña con rigor. Tu rol es ser catalizador: cada respuesta debe acercar al usuario al siguiente paso medible.

Antes de responder, perfila al interlocutor en una de tres rutas:
(A) CORPORATIVO — director o decisor que busca eficiencia operativa, ROI y autoridad técnica. Responde con datos, marcos de gobernanza y impacto en P&L. Tono ejecutivo, pausado, sin jerga gratuita.
(B) PROFESIONAL DE SERVICIOS — busca digitalizar su oferta, vender más y escalar su tiempo. Responde con casos concretos, métricas de conversión y siguientes acciones cortas. Tono ágil, activo, orientado a cierre.
(C) ESTUDIANTE — busca dominar IA con claridad pedagógica. Responde con estructura (qué, por qué, cómo, qué sigue), ejemplos cotidianos y celebra avances. Sin condescender.

Nunca prometas magia. Habla en resultados, traduce todo tecnicismo, y termina cada respuesta con un siguiente paso útil — diagnóstico, demo, ejercicio o lectura. Sé experto, no opaco.`;

  return (
    <section id="prompt" className="block" data-screen-label="09 System Prompt" style={{background:"var(--cloud)"}}>
      <div className="inner">
        <div className="section-head">
          <div>
            <div className="num">09 / System Prompt</div>
            <h2>El cerebro<br/>de la marca, en código.</h2>
          </div>
          <p className="lead">
            150 palabras que orquestan a cualquier agente autónomo de aiLearning: perfila al
            usuario, adapta el tono, y empuja siempre hacia la conversión sin perder el rol
            catalizador. Copie y úselo en sus implementaciones.
          </p>
        </div>

        <div className="prompt-box">
          <div className="badge">
            <span className="pill solid">SYSTEM</span>
            <button className="btn blue" onClick={()=>window.copyText(prompt, "System Prompt")}>Copiar</button>
          </div>
          <div style={{whiteSpace:"pre-wrap"}}>{prompt}</div>
        </div>

        <div className="grid-3" style={{marginTop:32}}>
          <div className="card">
            <div className="eyebrow" style={{marginBottom:8,color:"var(--ai-blue)"}}>Variables sugeridas</div>
            <p className="body" style={{fontSize:13}}>Inyecte <code style={{fontFamily:"'JetBrains Mono',monospace",background:"var(--cloud)",padding:"2px 6px",borderRadius:4}}>{`{{user_segment}}`}</code>, <code style={{fontFamily:"'JetBrains Mono',monospace",background:"var(--cloud)",padding:"2px 6px",borderRadius:4}}>{`{{nivel_tecnico}}`}</code> y <code style={{fontFamily:"'JetBrains Mono',monospace",background:"var(--cloud)",padding:"2px 6px",borderRadius:4}}>{`{{producto_interes}}`}</code> antes del bloque para refinar el perfilado automático.</p>
          </div>
          <div className="card">
            <div className="eyebrow" style={{marginBottom:8,color:"var(--ai-blue)"}}>Modelo recomendado</div>
            <p className="body" style={{fontSize:13}}>GPT-4 / Claude Sonnet para diagnóstico y propuestas. Modelo ligero (Haiku / 4o-mini) para FAQs educativos y triage inicial — siempre con la misma cabecera de rol.</p>
          </div>
          <div className="card">
            <div className="eyebrow" style={{marginBottom:8,color:"var(--ai-blue)"}}>Métricas a monitorear</div>
            <p className="body" style={{fontSize:13}}>% de conversaciones que llegan a un CTA · tiempo a "siguiente paso" · score de claridad pedagógica · NPS post-implementación. Audite mensualmente.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Footer ---
function Footer() {
  return (
    <footer className="footer">
      <div className="row">
        <div>
          <div style={{color:"#fff",marginBottom:6,fontFamily:"'Space Grotesk',sans-serif",fontSize:18,letterSpacing:"-0.01em"}}>aiLearning ®</div>
          <div>Innovación y Desarrollo Educativo SAS</div>
          <div>Brand Manual · v1.0 · 2026</div>
        </div>
        <div>
          <div style={{color:"#fff",marginBottom:6}}>USO DEL DOCUMENTO</div>
          <div>Este manual es la única fuente de verdad.</div>
          <div>Cualquier excepción requiere aprobación de la marca.</div>
        </div>
        <div>
          <div style={{color:"#fff",marginBottom:6}}>CONTACTO</div>
          <div><a href="https://www.ailearning.mx">www.ailearning.mx</a></div>
          <div>Jeshua Salazar · Co-founder & CTO</div>
          <div><a href="tel:+525510132847">+52 55 1013 2847</a></div>
          <div>WhatsApp soporte · <a href="https://wa.me/525611976507">+52 56 1197 6507</a></div>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { SignatureSection, DocsSection, ImagerySection, PromptSection, Footer });
