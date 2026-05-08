/**
 * Prototype Generation Service
 * Simulates AI-powered prototype generation from client website data.
 * Designed to be easily swapped for a real OpenAI/Gemini integration later.
 */

const GENERATION_STEPS = [
  'prototypes.step.extracting',
  'prototypes.step.analyzing',
  'prototypes.step.reconstructing',
  'prototypes.step.modernizing',
  'prototypes.step.finalizing',
];

/** Generate a seeded color palette based on company name */
function generatePalette(companyName = '', industry = '') {
  const seed = (companyName + industry).charCodeAt(0) % 6;
  const palettes = [
    { primary: '#1a73e8', secondary: '#0d47a1', accent: '#4fc3f7', bg: '#0a1628', text: '#e8f0fe' },
    { primary: '#00897b', secondary: '#004d40', accent: '#80cbc4', bg: '#0a1f1e', text: '#e0f2f1' },
    { primary: '#7b1fa2', secondary: '#4a148c', accent: '#ce93d8', bg: '#1a0a2e', text: '#f3e5f5' },
    { primary: '#d32f2f', secondary: '#b71c1c', accent: '#ef9a9a', bg: '#1f0a0a', text: '#ffebee' },
    { primary: '#f57c00', secondary: '#e65100', accent: '#ffcc02', bg: '#1f1000', text: '#fff8e1' },
    { primary: '#388e3c', secondary: '#1b5e20', accent: '#a5d6a7', bg: '#0a1f0a', text: '#e8f5e9' },
  ];
  return palettes[seed];
}

/** Generate simulated extracted data from URL */
function extractWebsiteData(lead) {
  const { company = 'Empresa', website = '', industry = 'Tecnologia', notes = '' } = lead;

  const domainMatch = website.match(/(?:https?:\/\/)?(?:www\.)?([^./]+)/);
  const domain = domainMatch ? domainMatch[1] : company.toLowerCase().replace(/\s/g, '');

  const industries = {
    'Tecnologia': { services: ['Desenvolvimento de Software', 'Consultoria TI', 'Suporte Técnico', 'Cloud Computing', 'Cibersegurança'], hero: 'Transforme seu negócio com tecnologia de ponta' },
    'Saúde': { services: ['Consultas Online', 'Telemedicina', 'Gestão de Clínicas', 'Prontuário Digital', 'Agendamento Inteligente'], hero: 'Saúde digital que cuida de você' },
    'Educação': { services: ['Cursos Online', 'Mentoria', 'Certificações', 'E-learning', 'Tutoria Personalizada'], hero: 'Educação que transforma vidas' },
    'Varejo': { services: ['E-commerce', 'Gestão de Estoque', 'PDV Digital', 'Fidelização', 'Logística'], hero: 'Venda mais com menos esforço' },
    'Finanças': { services: ['Planejamento Financeiro', 'Investimentos', 'Seguros', 'Crédito', 'Consultoria'], hero: 'Seu futuro financeiro começa aqui' },
    'default': { services: ['Consultoria Estratégica', 'Implementação', 'Suporte', 'Treinamento', 'Auditoria'], hero: 'Soluções sob medida para o seu negócio' },
  };

  const industryData = industries[industry] || industries['default'];

  return {
    domain,
    company,
    industry,
    website,
    heroHeadline: industryData.hero,
    heroSubheadline: `${company} é líder em ${industry.toLowerCase()}, oferecendo soluções inovadoras para empresas que buscam excelência operacional.`,
    services: industryData.services,
    palette: generatePalette(company, industry),
    ctaText: 'Agendar Reunião',
    ctaSecondary: 'Saiba Mais',
    aboutText: `Fundada com a missão de transformar o mercado de ${industry.toLowerCase()}, a ${company} combina experiência técnica com inovação para entregar resultados extraordinários. Nossa equipe é formada por especialistas apaixonados que colocam o cliente no centro de tudo.`,
    differentials: [
      { icon: '⚡', title: 'Entrega Rápida', desc: 'Resultados em tempo recorde sem abrir mão da qualidade.' },
      { icon: '🎯', title: 'Foco em Resultados', desc: 'Cada solução é desenhada para gerar impacto mensurável.' },
      { icon: '🔒', title: 'Segurança Total', desc: 'Dados protegidos e processos auditáveis em cada etapa.' },
      { icon: '🤝', title: 'Parceria Duradoura', desc: 'Suporte contínuo para escalar junto com seu negócio.' },
    ],
    uxProblems: [
      'Hierarquia visual confusa — CTA principal não se destaca',
      'Conteúdo excessivo sem escanabilidade',
      'Mobile não otimizado — taxa de rejeição alta',
      'Formulário de contato com muitos campos obrigatórios',
      'Falta de prova social (depoimentos, clientes, casos)',
    ],
    improvements: [
      'Hero section com CTA primário em destaque e contraste alto',
      'Blocos de conteúdo curtos com ícones e microtextos',
      'Layout responsivo mobile-first com navegação simplificada',
      'Formulário reduzido a 3 campos essenciais + WhatsApp link',
      'Seção de resultados com números e logos de clientes',
    ],
  };
}

/** Build the full HTML prototype as a string */
function buildPrototypeHTML(data) {
  const { company, heroHeadline, heroSubheadline, services, palette, ctaText, ctaSecondary, aboutText, differentials } = data;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${company} — Site Profissional</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--primary:${palette.primary};--secondary:${palette.secondary};--accent:${palette.accent};--bg:${palette.bg};--text:${palette.text}}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
a{color:inherit;text-decoration:none}
.container{max-width:1200px;margin:0 auto;padding:0 2rem}

/* HEADER */
header{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.06)}
.header-inner{display:flex;align-items:center;justify-content:space-between;height:70px;max-width:1200px;margin:0 auto;padding:0 2rem}
.logo{font-size:1.4rem;font-weight:800;letter-spacing:-0.5px;color:var(--primary)}
nav{display:flex;gap:2rem}
nav a{font-size:.9rem;font-weight:500;opacity:.8;transition:.2s}
nav a:hover{opacity:1;color:var(--accent)}
.btn{padding:.7rem 1.5rem;border-radius:8px;font-weight:600;font-size:.9rem;cursor:pointer;transition:.2s;border:none}
.btn-primary{background:var(--primary);color:#fff}
.btn-primary:hover{background:var(--secondary);transform:translateY(-1px)}
.btn-outline{background:transparent;color:var(--primary);border:2px solid var(--primary)}
.btn-outline:hover{background:var(--primary);color:#fff}

/* HERO */
.hero{min-height:100vh;display:flex;align-items:center;padding-top:70px;background:linear-gradient(135deg,var(--bg) 0%,${palette.secondary}22 50%,var(--bg) 100%);position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-200px;right:-200px;width:600px;height:600px;background:radial-gradient(circle,${palette.primary}20,transparent 70%);border-radius:50%}
.hero-content{position:relative;z-index:2;max-width:700px}
.hero-badge{display:inline-block;padding:.4rem 1rem;background:${palette.primary}20;border:1px solid ${palette.primary}40;border-radius:20px;font-size:.8rem;font-weight:600;color:var(--accent);letter-spacing:1px;margin-bottom:1.5rem;text-transform:uppercase}
.hero h1{font-size:clamp(2.5rem,6vw,4.5rem);font-weight:900;line-height:1.1;letter-spacing:-2px;margin-bottom:1.5rem}
.hero h1 span{color:var(--primary)}
.hero p{font-size:1.2rem;opacity:.75;max-width:550px;margin-bottom:2.5rem}
.hero-actions{display:flex;gap:1rem;flex-wrap:wrap}

/* SERVICES */
.section{padding:6rem 0}
.section-label{font-size:.75rem;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:.75rem}
.section-title{font-size:clamp(2rem,4vw,3rem);font-weight:800;letter-spacing:-1px;margin-bottom:1rem}
.section-sub{opacity:.6;font-size:1.05rem;max-width:500px;margin-bottom:3rem}
.services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.5rem}
.service-card{padding:2rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:16px;transition:.3s;cursor:pointer}
.service-card:hover{background:rgba(255,255,255,.07);border-color:${palette.primary}50;transform:translateY(-4px)}
.service-icon{width:48px;height:48px;background:${palette.primary}15;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;margin-bottom:1rem}
.service-card h3{font-size:1rem;font-weight:700;margin-bottom:.5rem}
.service-card p{font-size:.85rem;opacity:.6}

/* DIFFERENTIALS */
.differentials-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:2rem}
.diff-card{display:flex;gap:1rem;align-items:flex-start}
.diff-icon{font-size:2rem;flex-shrink:0}
.diff-card h3{font-size:1rem;font-weight:700;margin-bottom:.35rem}
.diff-card p{font-size:.85rem;opacity:.6}

/* ABOUT */
.about-section{background:rgba(255,255,255,.02)}
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}
@media(max-width:768px){.about-grid{grid-template-columns:1fr}}
.about-text{font-size:1.1rem;opacity:.75;line-height:1.8}
.stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:2rem}
.stat-item{text-align:center;padding:1.5rem;background:rgba(255,255,255,.04);border-radius:16px;border:1px solid rgba(255,255,255,.06)}
.stat-number{font-size:2.5rem;font-weight:900;color:var(--primary);letter-spacing:-2px}
.stat-label{font-size:.8rem;opacity:.6;margin-top:.25rem}

/* CTA SECTION */
.cta-section{text-align:center;background:linear-gradient(135deg,${palette.primary}15,${palette.secondary}10)}
.cta-section h2{font-size:clamp(2rem,4vw,3rem);font-weight:900;letter-spacing:-1px;margin-bottom:1rem}
.cta-section p{opacity:.7;font-size:1.1rem;max-width:500px;margin:0 auto 2.5rem}
.cta-actions{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}

/* FOOTER */
footer{background:rgba(0,0,0,.4);border-top:1px solid rgba(255,255,255,.06);padding:3rem 0}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:3rem}
@media(max-width:768px){.footer-grid{grid-template-columns:1fr}}
.footer-brand .logo{display:block;margin-bottom:1rem}
.footer-brand p{font-size:.85rem;opacity:.5;max-width:280px}
.footer-col h4{font-size:.85rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;opacity:.4;margin-bottom:1.25rem}
.footer-col ul{list-style:none;display:flex;flex-direction:column;gap:.75rem}
.footer-col ul li a{font-size:.85rem;opacity:.6;transition:.2s}
.footer-col ul li a:hover{opacity:1;color:var(--accent)}
.footer-bottom{margin-top:3rem;padding-top:2rem;border-top:1px solid rgba(255,255,255,.04);text-align:center;font-size:.8rem;opacity:.3}

/* SCROLL ANIMATIONS */
@keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
.fade-up{animation:fadeUp .6s ease forwards}
</style>
</head>
<body>

<header>
  <div class="header-inner">
    <div class="logo">${company}</div>
    <nav>
      <a href="#services">Serviços</a>
      <a href="#about">Sobre</a>
      <a href="#contact">Contato</a>
    </nav>
    <a href="#contact" class="btn btn-primary">${ctaText}</a>
  </div>
</header>

<section class="hero">
  <div class="container">
    <div class="hero-content fade-up">
      <div class="hero-badge">✦ ${data.industry}</div>
      <h1>${heroHeadline.split(' ').slice(0, 3).join(' ')} <span>${heroHeadline.split(' ').slice(3).join(' ')}</span></h1>
      <p>${heroSubheadline}</p>
      <div class="hero-actions">
        <a href="#contact" class="btn btn-primary">${ctaText}</a>
        <a href="#services" class="btn btn-outline">${ctaSecondary}</a>
      </div>
    </div>
  </div>
</section>

<section class="section" id="services">
  <div class="container">
    <div class="section-label">O que fazemos</div>
    <h2 class="section-title">Nossas Soluções</h2>
    <p class="section-sub">Serviços pensados para impulsionar seu negócio com eficiência e inovação.</p>
    <div class="services-grid">
      ${services.map((s, i) => `
      <div class="service-card">
        <div class="service-icon">${['💡','🚀','🔧','📊','🛡️'][i % 5]}</div>
        <h3>${s}</h3>
        <p>Soluções personalizadas para maximizar seus resultados em ${s.toLowerCase()}.</p>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="section about-section" id="about">
  <div class="container">
    <div class="about-grid">
      <div>
        <div class="section-label">Nossa História</div>
        <h2 class="section-title">Por que escolher a ${company}?</h2>
        <p class="about-text">${aboutText}</p>
      </div>
      <div>
        <div class="stats-grid">
          <div class="stat-item"><div class="stat-number">98%</div><div class="stat-label">Satisfação dos Clientes</div></div>
          <div class="stat-item"><div class="stat-number">5+</div><div class="stat-label">Anos de Mercado</div></div>
          <div class="stat-item"><div class="stat-number">200+</div><div class="stat-label">Projetos Entregues</div></div>
          <div class="stat-item"><div class="stat-number">50+</div><div class="stat-label">Especialistas</div></div>
        </div>
      </div>
    </div>
    <div class="differentials-grid" style="margin-top:4rem">
      ${differentials.map(d => `
      <div class="diff-card">
        <div class="diff-icon">${d.icon}</div>
        <div><h3>${d.title}</h3><p>${d.desc}</p></div>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="section cta-section" id="contact">
  <div class="container">
    <h2>Pronto para transformar sua empresa?</h2>
    <p>Agende uma reunião gratuita com nossos especialistas e descubra o potencial do seu negócio.</p>
    <div class="cta-actions">
      <a href="mailto:contato@${data.domain}.com.br" class="btn btn-primary" style="font-size:1rem;padding:.9rem 2rem">${ctaText} — Grátis</a>
      <a href="https://wa.me/55" class="btn btn-outline" style="font-size:1rem;padding:.9rem 2rem">💬 WhatsApp</a>
    </div>
  </div>
</section>

<footer>
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <span class="logo">${company}</span>
        <p>Transformando negócios com tecnologia e inovação. Sua empresa merece o melhor.</p>
      </div>
      <div class="footer-col">
        <h4>Serviços</h4>
        <ul>${services.slice(0,3).map(s => `<li><a href="#">${s}</a></li>`).join('')}</ul>
      </div>
      <div class="footer-col">
        <h4>Empresa</h4>
        <ul>
          <li><a href="#">Sobre Nós</a></li>
          <li><a href="#">Cases</a></li>
          <li><a href="#">Contato</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">© ${new Date().getFullYear()} ${company}. Todos os direitos reservados.</div>
  </div>
</footer>

</body>
</html>`;
}

/** Main service export */
export const prototypeService = {
  GENERATION_STEPS,

  /**
   * Generate a prototype for a lead.
   * @param {object} lead - lead data with company, website, industry
   * @param {function} onStep - callback(stepKey, progress) for progress updates
   * @returns {Promise<object>} prototype data
   */
  async generate(lead, onStep = () => {}) {
    const stepDelay = 1200;

    for (let i = 0; i < GENERATION_STEPS.length; i++) {
      onStep(GENERATION_STEPS[i], Math.round(((i + 1) / GENERATION_STEPS.length) * 100));
      await new Promise(r => setTimeout(r, stepDelay));
    }

    const extracted = extractWebsiteData(lead);
    const html = buildPrototypeHTML(extracted);

    return {
      id: `proto_${Date.now()}`,
      lead_id: lead.id,
      client_name: lead.company,
      website_url: lead.website || '',
      industry: lead.industry || 'Tecnologia',
      palette: extracted.palette,
      pages: ['home', 'about', 'services', 'contact'],
      html,
      extracted,
      ux_problems: extracted.uxProblems,
      improvements: extracted.improvements,
      created_at: new Date().toISOString(),
      version: 1,
      status: 'pending', // pending, approved, code_generated
    };
  },

  /** Load prototypes from localStorage */
  loadAll() {
    try {
      return JSON.parse(localStorage.getItem('kentauros_prototypes') || '[]');
    } catch {
      return [];
    }
  },

  /** Save a prototype to localStorage */
  save(proto) {
    const all = this.loadAll();
    const idx = all.findIndex(p => p.id === proto.id);
    if (idx >= 0) {
      all[idx] = proto;
    } else {
      all.unshift(proto);
    }
    localStorage.setItem('kentauros_prototypes', JSON.stringify(all));
    return proto;
  },

  /** Approve a prototype for code generation */
  approve(id) {
    const all = this.loadAll();
    const idx = all.findIndex(p => p.id === id);
    if (idx >= 0) {
      all[idx].status = 'approved';
      localStorage.setItem('kentauros_prototypes', JSON.stringify(all));
      return all[idx];
    }
    return null;
  },

  /** Mark a prototype as code generated */
  markAsCodeGenerated(id) {
    const all = this.loadAll();
    const idx = all.findIndex(p => p.id === id);
    if (idx >= 0) {
      all[idx].status = 'code_generated';
      localStorage.setItem('kentauros_prototypes', JSON.stringify(all));
      return all[idx];
    }
    return null;
  },

  /** Delete a prototype by id */
  delete(id) {
    const all = this.loadAll().filter(p => p.id !== id);
    localStorage.setItem('kentauros_prototypes', JSON.stringify(all));
  },
};
