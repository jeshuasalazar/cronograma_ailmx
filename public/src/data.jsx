// ============ aiLearning Brand Data ============
const NAV = [
  { id: "cover",    n: "00", label: "Portada" },
  { id: "essence",  n: "01", label: "Esencia de marca" },
  { id: "logo",     n: "02", label: "Sistema de logotipo" },
  { id: "color",    n: "03", label: "Paleta de color" },
  { id: "type",     n: "04", label: "Tipografía" },
  { id: "voice",    n: "05", label: "Voz y tono" },
  { id: "signature",n: "06", label: "Firma de correo" },
  { id: "docs",     n: "07", label: "Documentos" },
  { id: "imagery",  n: "08", label: "Fotografía y UI" },
  { id: "prompt",   n: "09", label: "System Prompt" },
];

const COLORS = {
  primary: [
    { name: "aiLearning Blue", hex: "#2D88E8", rgb: "45, 136, 232", cmyk: "81, 41, 0, 9", role: "Primario · 60%", use: "Logotipo, links, CTA principal, foco visual" },
    { name: "Deep Ink",         hex: "#0E1B2C", rgb: "14, 27, 44",   cmyk: "85, 64, 35, 76", role: "Secundario · 30%", use: "Texto principal, headings, fondos de autoridad" },
    { name: "Cloud",            hex: "#F4F2EC", rgb: "244, 242, 236", cmyk: "0, 1, 4, 4",  role: "Soporte", use: "Fondos suaves, separadores, contenedores neutros" },
  ],
  accent: [
    { name: "Conversion Coral", hex: "#FF6B47", rgb: "255, 107, 71", cmyk: "0, 71, 76, 0", role: "Acento · 10%", use: "Growth, ventas, urgencia, métricas de ROI" },
    { name: "Signal Sage",      hex: "#6B9080", rgb: "107, 144, 128",cmyk: "47, 19, 39, 4", role: "Educativo", use: "Materiales pedagógicos, sección estudiantes" },
    { name: "Deep Blue",        hex: "#1A5FB4", rgb: "26, 95, 180",  cmyk: "86, 64, 0, 0", role: "Corporativo", use: "Materiales para sector corporativo, gravitas" },
  ],
  neutrals: [
    { name: "Paper",  hex: "#FBFAF6", rgb: "251, 250, 246", cmyk: "0, 1, 2, 2" },
    { name: "Line",   hex: "#E8E5DD", rgb: "232, 229, 221", cmyk: "0, 1, 5, 9" },
    { name: "Mute",   hex: "#6B7484", rgb: "107, 116, 132", cmyk: "47, 31, 19, 31" },
    { name: "Ink-2",  hex: "#1F2D42", rgb: "31, 45, 66",    cmyk: "82, 60, 30, 65" },
  ]
};

const VOICE_PROFILES = [
  {
    id: "ceo",
    color: "#1A5FB4",
    audience: "Director General",
    objective: "Eficiencia operativa, ROI, autoridad técnica",
    quote: "Implementar un ecosistema de IA no es un proyecto: es una palanca operativa. Diseñamos agentes autónomos que reducen el costo por transacción y liberan a su equipo para decisiones de alto valor.",
    do: ["Comenzar con el impacto en P&L y EBITDA","Usar datos concretos: ahorro, throughput, tiempo a valor","Tono ejecutivo, pausado, con autoridad","Referenciar marcos: gobierno, seguridad, cumplimiento"],
    dont: ["Jerga de hacker o memes de IA","Promesas vagas o futuristas","Diminutivos, exceso de adjetivos","Stack técnico sin contexto de negocio"],
    sample: "“Reducimos el ciclo de cierre comercial 38% en 12 semanas — sin reemplazar a su equipo, multiplicando su alcance.”"
  },
  {
    id: "pro",
    color: "#FF6B47",
    audience: "Profesional de servicios",
    objective: "Digitalizar la oferta, vender más, escalar tiempo",
    quote: "Su mejor trabajo no debería depender de las horas que tiene en el día. Convertimos su know-how en un sistema que vende, atiende y escala mientras usted entrega resultados.",
    do: ["Hablar de conversión, leads, tickets y tiempo","Mostrar antes/después claros y rápidos","Frases activas, urgencia útil, foco en libertad","Casos concretos: agencia, despacho, consultoría"],
    dont: ["Tecnicismos sin traducir","Comprometerse con stacks técnicos al inicio","Sonar como agencia genérica de marketing","Promesas mágicas sin método"],
    sample: "“Su próximo lead llega a las 11pm. Con aiLearning lo atiende, lo califica y le agenda una llamada — usted solo entra a cerrar.”"
  },
  {
    id: "student",
    color: "#6B9080",
    audience: "Estudiante / Profesional en formación",
    objective: "Dominar IA con claridad pedagógica",
    quote: "La IA no es magia, es método. En cada módulo desarmamos una herramienta hasta su lógica más simple, la aplicamos a tu trabajo real, y la convertimos en una habilidad que te diferencia.",
    do: ["Lenguaje claro, sin condescender","Ejemplos cotidianos antes que abstracciones","Estructura: qué, por qué, cómo, qué sigue","Celebrar avances, dar marco mental"],
    dont: ["Asumir conocimiento previo no declarado","Apilar acrónimos en un solo párrafo","Tono motivacional vacío","Sentirse exclusivo o intimidante"],
    sample: "“Hoy aprendes a delegar tu primera tarea repetitiva a un agente — y mañana tu calendario nota la diferencia.”"
  }
];

const PERSONALITY = [
  { word: "Catalizadora",  desc: "Aceleramos. No describimos el cambio, lo provocamos." },
  { word: "Orientada a resultados", desc: "Medimos en ROI, throughput, conversiones — no en horas." },
  { word: "Pedagógica",    desc: "Toda transformación es enseñable. Claridad antes que efecto." },
  { word: "Técnica con criterio", desc: "Dominio profundo aplicado con sentido de negocio." },
];

const FONTS = {
  display: {
    name: "Space Grotesk",
    role: "Display & Titulares",
    why: "Geometría moderna con contraste óptico mínimo: vanguardia tecnológica sin perder calidez. Excelente en pesos 500–700 para autoridad ejecutiva.",
    weights: ["400 Regular","500 Medium","600 SemiBold","700 Bold"],
    sample: "Acelere y escale su operación con inteligencia artificial aplicada."
  },
  body: {
    name: "DM Sans",
    role: "Cuerpo de texto & UI",
    why: "Humanista neogeométrica diseñada para lecturas de alto volumen. Altura-x generosa para temarios y materiales educativos; tracking estable en propuestas comerciales largas.",
    weights: ["400 Regular","500 Medium","600 SemiBold","700 Bold"],
    sample: "Diseñamos ecosistemas de IA que digitalizan procesos, escalan ventas y empoderan equipos. Cada implementación reduce el tiempo a valor y multiplica el ROI medible."
  },
  mono: {
    name: "JetBrains Mono",
    role: "Mono & código",
    why: "Para datos, prompts, métricas, KPIs y especificaciones técnicas. Diferenciación clara entre caracteres similares para evitar errores en documentación.",
    weights: ["400 Regular","500 Medium","600 SemiBold"],
    sample: "ROI = (∆ventas − inversión) / inversión · 100"
  }
};

const APP_DATA = { NAV, COLORS, VOICE_PROFILES, PERSONALITY, FONTS };
Object.assign(window, { APP_DATA, NAV, COLORS, VOICE_PROFILES, PERSONALITY, FONTS });
