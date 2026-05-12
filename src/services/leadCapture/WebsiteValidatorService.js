// WebsiteValidatorService - Validação real de websites
// Valida domínio, HTTP, conteúdo, SSL, etc.

const PROXY_ENDPOINTS = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

const BLOCKED_PATTERNS = [
  /godaddy/i, /parking/i, /expired/i, /forbidden/i,
  /nginx/i, /apache/i, /placeholder/i, /underconstruction/i,
  /sitebuilder/i, /wixsite/i, /blogspot/i, /wordpress\.com$/i,
];

const DNS_SKIP_DOMAINS = [
  'localhost', '127.0.0.1', '.local', '.test', '.invalid',
  'example.com', 'example.org', 'test.com',
];

export class WebsiteValidationResult {
  constructor(data) {
    this.isValid = data.isValid || false;
    this.domain = data.domain || '';
    this.url = data.url || '';
    this.statusCode = data.statusCode || 0;
    this.hasHttps = data.hasHttps || false;
    this.hasContent = data.hasContent || false;
    this.title = data.title || '';
    this.contentLength = data.contentLength || 0;
    this.contentType = data.contentType || '';
    this.server = data.server || '';
    this.responseTime = data.responseTime || 0;
    this.errors = data.errors || [];
    this.warnings = data.warnings || [];
    this.isParked = data.isParked || false;
    this.isFake = data.isFake || false;
    this.reason = data.reason || '';
    this.validatedAt = new Date().toISOString();
  }
}

export class WebsiteValidatorService {
  constructor(options = {}) {
    this.timeout = options.timeout || 15000;
    this.retries = options.retries || 2;
    this.minContentLength = options.minContentLength || 500;
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    this.isDev = import.meta.env?.DEV || process.env?.NODE_ENV === 'development';
  }

  // Verificar se domínio deve ser pulado
  shouldSkipDomain(domain) {
    if (!domain) return true;
    const lower = domain.toLowerCase();
    return DNS_SKIP_DOMAINS.some(d => lower.includes(d));
  }

  // Validar formato de domínio
  isValidDomainFormat(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    const simpleRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain) || simpleRegex.test(domain);
  }

  // Extrair hostname da URL
  extractHostname(url) {
    try {
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//, '').split('/')[0];
    }
  }

  // HEAD request simples para verificar domínio
  async checkDomainExists(url) {
    const hostname = this.extractHostname(url);

    if (this.shouldSkipDomain(hostname)) {
      return { exists: false, reason: 'invalid_domain_format' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'User-Agent': this.userAgent },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      return {
        exists: true,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { exists: false, reason: 'timeout' };
      }
      return { exists: false, reason: error.message };
    }
  }

  // Verificar SSL/TLS
  async checkSSL(url) {
    if (!url.startsWith('https://')) {
      return { hasSSL: false, reason: 'no_https' };
    }

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      return { hasSSL: true, valid: true };
    } catch (error) {
      return { hasSSL: false, reason: error.message };
    }
  }

  // Fetch real do conteúdo com proxies
  async fetchWithProxies(url, options = {}) {
    const { timeout = this.timeout, retries = this.retries } = options;
    const errors = [];

    for (let attempt = 0; attempt < retries; attempt++) {
      for (const proxyFn of PROXY_ENDPOINTS) {
        try {
          const proxyUrl = proxyFn(url);
          const startTime = Date.now();

          const response = await fetch(proxyUrl, {
            signal: AbortSignal.timeout(timeout),
            headers: {
              'accept': 'text/html,application/xhtml+xml',
              'User-Agent': this.userAgent,
            },
          });

          const responseTime = Date.now() - startTime;

          if (response.ok) {
            const contentType = response.headers.get('content-type') || '';
            const text = await response.text();

            return {
              success: true,
              status: response.status,
              content: text,
              contentLength: text.length,
              contentType,
              responseTime,
            };
          } else {
            errors.push({ attempt, proxy: proxyFn.name, status: response.status });
          }
        } catch (error) {
          errors.push({ attempt, proxy: proxyFn.name, error: error.message });
        }
      }
    }

    return { success: false, errors };
  }

  // Verificar se página está "estacionada"
  isParkedPage(content, title) {
    if (!content && !title) return true;

    const parkedKeywords = [
      'this domain', 'for sale', 'parked', 'landing page',
      'buy this domain', 'sell this domain', 'domain expired',
      'under construction', 'coming soon', 'placeholder',
    ];

    const lowerContent = (content + ' ' + title).toLowerCase();
    return parkedKeywords.some(kw => lowerContent.includes(kw));
  }

  // Verificar se conteúdo é "fake" ou placeholder
  isFakeContent(content) {
    if (!content || content.length < 100) return true;

    const fakePatterns = [
      /lorem ipsum/i,
      /sample text/i,
      /dummy content/i,
      /just a placeholder/i,
      /^<html><body><\/body><\/html>$/i,
    ];

    return fakePatterns.some(pattern => pattern.test(content));
  }

  // Extrair título da página
  extractTitle(content) {
    const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
  }

  // Extrair meta description
  extractMetaDescription(content) {
    const match = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'/i);
    return match ? match[1].trim() : '';
  }

  // Extrair informações básicas do site
  extractBasicInfo(content) {
    return {
      title: this.extractTitle(content),
      description: this.extractMetaDescription(content),
      hasH1: /<h1[^>]*>/i.test(content),
      hasForm: /<form[^>]*>/i.test(content),
      hasContact: /contact|contato|email|telefone|fone/i.test(content),
      hasCTA: /cta|comprar|agendar|reservar|orcamento/i.test(content),
      hasWhatsApp: /whatsapp|wa\.me|api\.whatsapp/i.test(content),
      hasPhone: /(\+?55)?[\s.-]?\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}/.test(content),
      hasEmail: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content),
      hasSocialLinks: /facebook\.com|instagram\.com|linkedin\.com|twitter\.com/i.test(content),
      hasMaps: /google\.com\/maps|google\.maps|waze\.com/i.test(content),
    };
  }

  // Validação principal do website
  async validateWebsite(url) {
    const startTime = Date.now();
    const hostname = this.extractHostname(url);
    const result = {
      isValid: false,
      domain: hostname,
      url,
      errors: [],
      warnings: [],
    };

    // 1. Verificar formato do domínio
    if (this.shouldSkipDomain(hostname)) {
      result.reason = 'invalid_domain';
      result.errors.push('Domínio com formato inválido');
      console.log('[WebsiteValidator] REJEITADO -', hostname, '- Domínio inválido');
      return new WebsiteValidationResult(result);
    }

    // Em DEV, permitir domínios fake para teste
    if (this.isDev) {
      console.log('[WebsiteValidator] DEV MODE - pulando validação real');
      return new WebsiteValidationResult({
        isValid: true,
        domain: hostname,
        url,
        hasHttps: url.startsWith('https://'),
        hasContent: true,
        title: `Site ${hostname}`,
        contentLength: 1000,
        reason: 'dev_mode_skip',
      });
    }

    // 2. Verificar SSL
    const sslCheck = await this.checkSSL(url);
    result.hasHttps = sslCheck.hasSSL;
    if (!sslCheck.hasSSL) {
      result.warnings.push('Site sem HTTPS (não é致命 erro)');
    }

    // 3. Fetch real do conteúdo
    console.log('[WebsiteValidator] VALIDANDO -', url);
    const fetchResult = await this.fetchWithProxies(url);

    if (!fetchResult.success) {
      result.reason = 'fetch_failed';
      result.errors.push(`Falha ao acessar: ${fetchResult.errors?.[0]?.error || 'Erro desconhecido'}`);
      console.log('[WebsiteValidator] REJEITADO -', hostname, '- Fetch falhou:', fetchResult.errors?.[0]?.error);
      return new WebsiteValidationResult(result);
    }

    result.statusCode = fetchResult.status;
    result.contentLength = fetchResult.contentLength;
    result.responseTime = fetchResult.responseTime;

    // 4. Verificar conteúdo mínimo
    if (fetchResult.contentLength < this.minContentLength) {
      result.reason = 'insufficient_content';
      result.errors.push('Conteúdo muito curto');
      console.log('[WebsiteValidator] REJEITADO -', hostname, '- Conteúdo insuficiente:', fetchResult.contentLength);
      return new WebsiteValidationResult(result);
    }

    const content = fetchResult.content;

    // 5. Verificar página estacionada
    const title = this.extractTitle(content);
    if (this.isParkedPage(content, title)) {
      result.reason = 'parked_domain';
      result.errors.push('Domínio estacionado');
      console.log('[WebsiteValidator] REJEITADO -', hostname, '- Domínio estacionado');
      return new WebsiteValidationResult(result);
    }

    // 6. Verificar conteúdo fake
    if (this.isFakeContent(content)) {
      result.reason = 'fake_content';
      result.errors.push('Conteúdo parece fake/placeholder');
      console.log('[WebsiteValidator] REJEITADO -', hostname, '- Conteúdo fake');
      return new WebsiteValidationResult(result);
    }

    // 7. Extrair informações
    const basicInfo = this.extractBasicInfo(content);
    result.title = basicInfo.title;
    result.hasContent = true;

    // Tudo OK - site válido
    result.isValid = true;
    result.reason = 'valid';

    console.log('[WebsiteValidator] APROVADO -', hostname, '- Title:', title);

    return new WebsiteValidationResult(result);
  }

  // Validar múltiplos websites
  async validateBatch(urls, onProgress) {
    const results = [];
    let processed = 0;

    for (const url of urls) {
      const result = await this.validateWebsite(url);
      results.push(result);
      processed++;

      if (onProgress) {
        onProgress({
          processed,
          total: urls.length,
          valid: results.filter(r => r.isValid).length,
          invalid: results.filter(r => !r.isValid).length,
          current: url,
        });
      }
    }

    return results;
  }
}

export default WebsiteValidatorService;