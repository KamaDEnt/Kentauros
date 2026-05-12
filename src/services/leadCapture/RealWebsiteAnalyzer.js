// RealWebsiteAnalyzer - Análise real do site para score
// Analisa estrutura, tecnologia, problemas, oportunidades

export class WebsiteAnalysisResult {
  constructor(data) {
    this.domain = data.domain || '';
    this.url = data.url || '';
    this.issues = data.issues || [];
    this.opportunities = data.opportunities || [];
    this.score = data.score || 0;
    this.scoreBreakdown = data.scoreBreakdown || {};
    this.quality = data.quality || 'unknown';
    this.technology = data.technology || {};
    this.seo = data.seo || {};
    this.security = data.security || {};
    this.mobile = data.mobile || {};
    this.analyzedAt = new Date().toISOString();
  }
}

export class RealWebsiteAnalyzer {
  constructor() {
    this.isDev = import.meta.env?.DEV || process.env?.NODE_ENV === 'development';
  }

  // Analisar website real
  async analyze(url) {
    const startTime = Date.now();
    const domain = this.extractDomain(url);

    console.log('[WebsiteAnalyzer] ANALISANDO -', url);

    const result = {
      domain,
      url,
      issues: [],
      opportunities: [],
      scoreBreakdown: {},
      technology: {},
      seo: {},
      security: {},
      mobile: {},
    };

    try {
      // Fetch conteúdo
      const content = await this.fetchContent(url);

      if (!content) {
        result.issues.push('Falha ao acessar conteúdo');
        return new WebsiteAnalysisResult(result);
      }

      // Análises
      this.analyzeTechnology(content, result);
      this.analyzeSEO(content, result);
      this.analyzeSecurity(url, result);
      this.analyzeMobile(content, result);
      this.analyzeStructure(content, result);
      this.analyzeContact(content, result);
      this.analyzeBusiness(content, result);

      // Calcular score final
      result.score = this.calculateScore(result);
      result.quality = this.getQualityLabel(result.score);

      const duration = Date.now() - startTime;
      console.log('[WebsiteAnalyzer] CONCLUÍDO -', domain, '- Score:', result.score, '- Duração:', duration + 'ms');

    } catch (error) {
      console.error('[WebsiteAnalyzer] ERRO -', domain, '-', error.message);
      result.issues.push(`Erro na análise: ${error.message}`);
    }

    return new WebsiteAnalysisResult(result);
  }

  // Fetch conteúdo com proxy
  async fetchContent(url) {
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
    ];

    for (const proxy of proxies) {
      try {
        const response = await fetch(proxy, {
          signal: AbortSignal.timeout(20000),
          headers: { 'accept': 'text/html' },
        });

        if (response.ok) {
          return await response.text();
        }
      } catch {
        // Tentar próximo proxy
      }
    }

    return null;
  }

  extractDomain(url) {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//, '').split('/')[0];
    }
  }

  // Analisar tecnologias detectadas
  analyzeTechnology(content, result) {
    const tech = {
      hasCMS: false,
      cms: null,
      hasBuilder: false,
      builder: null,
      hasFramework: false,
      framework: null,
      hasAnalytics: false,
      analytics: [],
      hasChat: false,
      hasPayment: false,
    };

    // CMS Detection
    if (content.includes('wp-content') || content.includes('wordpress')) {
      tech.hasCMS = true;
      tech.cms = 'WordPress';
    } else if (content.includes('drupal')) {
      tech.hasCMS = true;
      tech.cms = 'Drupal';
    } else if (content.includes('joomla')) {
      tech.hasCMS = true;
      tech.cms = 'Joomla';
    }

    // Site Builders
    if (content.includes('wix.com') || content.includes('wixdata')) {
      tech.hasBuilder = true;
      tech.builder = 'Wix';
    } else if (content.includes('squarespace')) {
      tech.hasBuilder = true;
      tech.builder = 'Squarespace';
    } else if (content.includes('shopify')) {
      tech.hasBuilder = true;
      tech.builder = 'Shopify';
    } else if (content.includes('wixsite')) {
      tech.hasBuilder = true;
      tech.builder = 'Wix';
    }

    // Analytics
    const analyticsTags = [
      { pattern: /google-analytics\.com|analytics\.js|ga\.js/gi, name: 'Google Analytics' },
      { pattern: /googletagmanager\.com/gi, name: 'Google Tag Manager' },
      { pattern: /facebook\.com.*fbq|fbevents/gi, name: 'Facebook Pixel' },
      { pattern: /hotjar\.com/gi, name: 'Hotjar' },
      { pattern: /mixpanel\.com/gi, name: 'Mixpanel' },
    ];

    for (const tag of analyticsTags) {
      if (tag.pattern.test(content)) {
        tech.hasAnalytics = true;
        tech.analytics.push(tag.name);
      }
    }

    // Chat
    if (content.includes('intercom') || content.includes('drift') ||
        content.includes('zendesk') || content.includes('tawk.to') ||
        content.includes('olark') || content.includes('livechat')) {
      tech.hasChat = true;
    }

    // Payment
    if (content.includes('pagseguro') || content.includes('mercadopago') ||
        content.includes('stripe') || content.includes('paypal')) {
      tech.hasPayment = true;
    }

    result.technology = tech;

    // Issues baseados em tecnologia
    if (tech.hasBuilder && tech.builder !== 'Shopify') {
      result.issues.push(`Site em plataforma ${tech.builder || 'conhecida'} - oportunidade de upgrade`);
    }
    if (tech.hasCMS && tech.cms === 'WordPress') {
      result.opportunities.push('WordPress detectado - pode ser otimizado com tema moderno');
    }
  }

  // Analisar SEO
  analyzeSEO(content, result) {
    const seo = {
      hasTitle: false,
      title: '',
      hasMetaDescription: false,
      metaDescription: '',
      hasViewport: false,
      hasOpenGraph: false,
      hasFavicon: false,
      hasH1: false,
      h1Count: 0,
      hasCanonical: false,
      imageAltCount: 0,
      totalImages: 0,
    };

    // Title
    const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      seo.hasTitle = true;
      seo.title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Meta description
    const descMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'/i);
    if (descMatch) {
      seo.hasMetaDescription = true;
      seo.metaDescription = descMatch[1];
    }

    // Viewport
    seo.hasViewport = /<meta[^>]*viewport/i.test(content);

    // Open Graph
    seo.hasOpenGraph = /<meta[^>]*og:/i.test(content);

    // Favicon
    seo.hasFavicon = /<link[^>]*rel=["'](?:shortcut )?icon/i.test(content);

    // H1
    const h1Matches = content.match(/<h1[^>]*>/gi);
    seo.hasH1 = Boolean(h1Matches);
    seo.h1Count = h1Matches ? h1Matches.length : 0;

    // Canonical
    seo.hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(content);

    // Images with alt
    const imgMatches = content.match(/<img[^>]*>/gi) || [];
    seo.totalImages = imgMatches.length;
    const altMatches = content.match(/<img[^>]*alt=["'][^"']*["']/gi) || [];
    seo.imageAltCount = altMatches.length;

    result.seo = seo;

    // Issues de SEO
    if (!seo.hasTitle || seo.title.length < 10) {
      result.issues.push('Title ausente ou muito curto');
    }
    if (!seo.hasMetaDescription) {
      result.issues.push('Meta description ausente');
    }
    if (!seo.hasViewport) {
      result.issues.push('Viewport meta não configurado');
    }
    if (seo.hasH1 && seo.h1Count > 1) {
      result.issues.push('Múltiplos H1s - SEO afetado');
    }
    if (seo.totalImages > 0 && seo.imageAltCount < seo.totalImages * 0.5) {
      result.issues.push('Muitas imagens sem texto alternativo');
    }

    // Oportunidades de SEO
    if (seo.hasTitle && seo.title.length > 10 && seo.hasMetaDescription) {
      result.opportunities.push('SEO básico configurado - pode ser otimizado');
    }
  }

  // Analisar segurança
  analyzeSecurity(url, result) {
    const security = {
      hasHTTPS: url.startsWith('https://'),
      hasSSLIssue: false,
      hasMixedContent: false,
      hasFormsWithoutSecurity: false,
    };

    // Mixed content
    if (security.hasHTTPS && /src=["']http:/i.test(url)) {
      security.hasMixedContent = true;
    }

    // Forms sem HTTPS
    if (/<form[^>]*>/i.test(url) && !security.hasHTTPS) {
      security.hasFormsWithoutSecurity = true;
    }

    result.security = security;

    // Issues
    if (!security.hasHTTPS) {
      result.issues.push('Site sem certificado SSL');
      result.scoreBreakdown.ssl = 0;
    } else {
      result.scoreBreakdown.ssl = 100;
    }

    if (security.hasMixedContent) {
      result.issues.push('Conteúdo misto (HTTP em HTTPS)');
    }
  }

  // Analisar mobile
  analyzeMobile(content, result) {
    const mobile = {
      hasResponsive: false,
      hasMobileMenu: false,
      hasTouchFriendly: false,
      usesBootstrap: false,
      usesTailwind: false,
    };

    // Responsive
    mobile.hasResponsive = /<meta[^>]*viewport/i.test(content);

    // Mobile menu (hamburger pattern)
    mobile.hasMobileMenu = /hamburger|burger|menu toggle|navbar-toggler/i.test(content);

    // Touch friendly (larger tap targets)
    mobile.hasTouchFriendly = /min-height:\s*44px|min-width:\s*44px|touch-action/i.test(content);

    // CSS Frameworks
    mobile.usesBootstrap = /bootstrap/i.test(content);
    mobile.usesTailwind = /tailwindcss|tailwind\.css/i.test(content);

    result.mobile = mobile;

    // Issues
    if (!mobile.hasResponsive) {
      result.issues.push('Site não responsivo');
    }
  }

  // Analisar estrutura
  analyzeStructure(content, result) {
    const structure = {
      hasHeader: false,
      hasFooter: false,
      hasNav: false,
      hasCTAs: false,
      hasContact: false,
      hasAbout: false,
      hasServices: false,
      hasTestimonials: false,
      hasTeam: false,
    };

    structure.hasHeader = /<header[^>]*>/i.test(content);
    structure.hasFooter = /<footer[^>]*>/i.test(content);
    structure.hasNav = /<nav[^>]*>/i.test(content);
    structure.hasContact = /contact|contato|sobre|about/i.test(content);
    structure.hasAbout = /about|sobre|quem somos|nossa empresa/i.test(content);
    structure.hasServices = /services|servicos|produtos|solutions/i.test(content);
    structure.hasTestimonials = /testimonial|review|depoimento|avaliacao/i.test(content);
    structure.hasTeam = /team|equipe|nosso time|membros/i.test(content);

    // CTAs
    const ctaPatterns = [
      /comprar|buy|shop/i,
      /agendar|schedule|book/i,
      /contato|contact/i,
      /orcamento|quote|estimate/i,
      /assinar|sign up|subscribe/i,
    ];

    structure.hasCTAs = ctaPatterns.some(p => p.test(content));

    // Issues
    if (!structure.hasCTAs) {
      result.issues.push('Nenhum CTA claro encontrado');
    }
    if (!structure.hasContact) {
      result.issues.push('Seção de contato não encontrada');
    }
    if (!structure.hasAbout) {
      result.issues.push('Seção Sobre não encontrada');
    }

    // Oportunidades
    if (!structure.hasTestimonials) {
      result.opportunities.push('Depoimentos/clientes podem aumentar conversão');
    }
    if (!structure.hasTeam) {
      result.opportunities.push('Seção time/empresa pode gerar confiança');
    }
    if (structure.hasCTAs) {
      result.opportunities.push('CTAs encontrados - estrutura de conversão presente');
    }
  }

  // Analisar contato
  analyzeContact(content, result) {
    const contact = {
      hasPhone: false,
      phones: [],
      hasEmail: false,
      emails: [],
      hasWhatsApp: false,
      hasAddress: false,
      hasMap: false,
      hasSocial: false,
      socialLinks: [],
    };

    // Phones
    const phoneRegex = /(\+?55)?[\s.-]?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/g;
    const phones = content.match(phoneRegex) || [];
    if (phones.length > 0) {
      contact.hasPhone = true;
      contact.phones = [...new Set(phones)];
    }

    // Emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const emails = content.match(emailRegex) || [];
    const validEmails = emails.filter(e =>
      !/\.(png|jpg|jpeg|gif|svg|ico|webp)$/i.test(e) &&
      !/noreply|no-reply|example@test/i.test(e)
    );
    if (validEmails.length > 0) {
      contact.hasEmail = true;
      contact.emails = [...new Set(validEmails)].slice(0, 5);
    }

    // WhatsApp
    contact.hasWhatsApp = /whatsapp|wa\.me|api\.whatsapp|chat\.whatsapp/i.test(content);

    // Address
    contact.hasAddress = /rua|avenida|alameda|travessa|street|av\.|número|number/i.test(content);

    // Map
    contact.hasMap = /google\.com\/maps|google\.maps|waze|embed.*map/i.test(content);

    // Social
    const socialPatterns = [
      { pattern: /facebook\.com\/[\w.]+/i, name: 'Facebook' },
      { pattern: /instagram\.com\/[\w.]+/i, name: 'Instagram' },
      { pattern: /linkedin\.com\/in\/[\w.]+/i, name: 'LinkedIn' },
      { pattern: /twitter\.com\/[\w.]+|x\.com\/[\w.]+/i, name: 'Twitter' },
    ];

    for (const s of socialPatterns) {
      if (s.pattern.test(content)) {
        contact.hasSocial = true;
        contact.socialLinks.push(s.name);
      }
    }

    result.contact = contact;

    // Issues
    if (!contact.hasPhone) {
      result.issues.push('Telefone não encontrado no site');
    }
    if (!contact.hasEmail) {
      result.issues.push('Email não encontrado no site');
    }
    if (!contact.hasSocial) {
      result.issues.push('Redes sociais não encontradas');
    }
    if (!contact.hasAddress) {
      result.issues.push('Endereço não encontrado');
    }

    // Oportunidades
    if (contact.hasWhatsApp) {
      result.opportunities.push('WhatsApp disponível - alta conversão');
    }
    if (contact.hasMap) {
      result.opportunities.push('Google Maps integrado');
    }
  }

  // Analisar бизнес sinais
  analyzeBusiness(content, result) {
    const business = {
      hasPrice: false,
      hasPortfolio: false,
      hasBlog: false,
      hasFAQ: false,
      hasPricing: false,
      hasFAQ: false,
      hasNewsletter: false,
    };

    business.hasPrice = /R\$\s*\d|price|valor|preço|€/i.test(content);
    business.hasPortfolio = /portfolio|trabalhos|projetos|galeria|cases/i.test(content);
    business.hasBlog = /blog|artigos|notícias|news/i.test(content);
    business.hasPricing = /tabela de preços|preços|orcamento|estimate/i.test(content);
    business.hasFAQ = /faq|perguntas|duvidas|questions/i.test(content);
    business.hasNewsletter = /newsletter|assinar|e-mail|subscribe/i.test(content);

    result.business = business;
  }

  // Calcular score final
  calculateScore(result) {
    let totalScore = 0;
    let maxScore = 0;

    // 1. Segurança (20 pontos)
    maxScore += 20;
    result.scoreBreakdown.security = result.security.hasHTTPS ? 20 : 0;
    if (!result.security.hasFormsWithoutSecurity) {
      result.scoreBreakdown.security += 5;
      maxScore += 5;
    }

    // 2. SEO (20 pontos)
    maxScore += 20;
    const seoScore = (
      (result.seo.hasTitle ? 5 : 0) +
      (result.seo.hasMetaDescription ? 5 : 0) +
      (result.seo.hasViewport ? 5 : 0) +
      (result.seo.hasH1 ? 3 : 0) +
      (result.seo.hasOpenGraph ? 2 : 0)
    );
    result.scoreBreakdown.seo = seoScore;

    // 3. Mobile (15 pontos)
    maxScore += 15;
    result.scoreBreakdown.mobile = result.mobile.hasResponsive ? 10 : 0;
    if (result.mobile.hasMobileMenu) result.scoreBreakdown.mobile += 5;

    // 4. Contato (20 pontos)
    maxScore += 20;
    const contactScore = (
      (result.contact?.hasPhone ? 7 : 0) +
      (result.contact?.hasEmail ? 7 : 0) +
      (result.contact?.hasWhatsApp ? 5 : 0) +
      (result.contact?.hasAddress ? 3 : 0) +
      (result.contact?.hasSocial ? 3 : 0) +
      (result.contact?.hasMap ? 2 : 0)
    );
    result.scoreBreakdown.contact = contactScore;

    // 5. Estrutura (15 pontos)
    maxScore += 15;
    const structureScore = (
      (result.seo?.hasTitle && result.seo.title.length > 20 ? 3 : 0) +
      (result.structure?.hasHeader ? 3 : 0) +
      (result.structure?.hasFooter ? 3 : 0) +
      (result.structure?.hasCTAs ? 4 : 0) +
      (result.structure?.hasAbout ? 2 : 0)
    );
    result.scoreBreakdown.structure = structureScore;

    // 6. Tecnologia (10 pontos)
    maxScore += 10;
    const techScore = (
      (result.technology?.hasAnalytics ? 4 : 0) +
      (result.technology?.hasChat ? 3 : 0) +
      (result.technology?.hasPayment ? 3 : 0)
    );
    result.scoreBreakdown.technology = techScore;

    // Penalidades por issues
    const issuePenalty = result.issues.length * 3;
    totalScore = Math.max(0, totalScore - issuePenalty);

    // Score final (0-100)
    const finalScore = Math.round((totalScore / maxScore) * 100);

    console.log('[WebsiteAnalyzer] Score:', finalScore, '- Issues:', result.issues.length, '- Oportunidades:', result.opportunities.length);

    return Math.min(100, Math.max(5, finalScore));
  }

  // Obter label de qualidade
  getQualityLabel(score) {
    if (score >= 80) return 'excelente';
    if (score >= 60) return 'bom';
    if (score >= 40) return 'regular';
    if (score >= 20) return 'ruim';
    return 'muito_ruim';
  }
}

export default RealWebsiteAnalyzer;