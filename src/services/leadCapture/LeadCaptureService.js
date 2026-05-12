// LeadCaptureService - Cliente frontend para captura de leads
// Este serviço apenas envia a configuração para o backend e exibe os resultados
// NÃO faz validação no browser - toda lógica está no backend

export class LeadCaptureService {
  constructor(dataProvider, baseUrl) {
    this.dataProvider = dataProvider;
    this.baseUrl = baseUrl || '';
    this.isDev = import.meta.env?.DEV || process.env?.NODE_ENV === 'development';
  }

  // ============================================
  // CAPTURA PRINCIPAL - chama backend
  // ============================================
  async runJob(jobId, config) {
    const {
      niche,
      location,
      quantity = 20,
      captureMetric = 'website_reformulation',
      contactRequirements = { email: true }
    } = config;

    console.log('[LeadCaptureService] ═══════════════════════════════════════');
    console.log('[LeadCaptureService] ENVIANDO CAPTURA PARA BACKEND');
    console.log('[LeadCaptureService] Nicho:', niche);
    console.log('[LeadCaptureService] Localização:', location);
    console.log('[LeadCaptureService] Quantidade:', quantity);
    console.log('[LeadCaptureService] Métrica:', captureMetric);
    console.log('[LeadCaptureService] ═══════════════════════════════════════');

    // Atualizar job inicial
    this.dataProvider.updateCaptureJob(jobId, {
      status: 'running',
      progress: 10,
      phaseLabel: 'Conectando com servidor de captura...',
      stats: {
        requested: quantity,
        candidatesFound: 0,
        candidatesScanned: 0,
        domainValidated: 0,
        domainRejected: 0,
        leadsQualified: 0,
        errors: [],
      },
    });

    try {
      // Determinar URL base da API
      const apiBase = this.isDev
        ? (this.baseUrl || 'http://localhost:3001')
        : (this.baseUrl || window.location.origin);

      const apiUrl = `${apiBase}/api/leads/capture`;

      console.log('[LeadCaptureService] Chamando API:', apiUrl);

      // Atualizar progresso para "buscando"
      this.dataProvider.updateCaptureJob(jobId, {
        progress: 20,
        phaseLabel: 'Buscando candidatos no servidor...',
      });

      // Fazer request para o backend
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          niche,
          location,
          quantity,
          captureMetric,
          contactRequirements,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      console.log('[LeadCaptureService] ═══════════════════════════════════════');
      console.log('[LeadCaptureService] RESULTADO DO BACKEND');
      console.log('[LeadCaptureService] Success:', result.success);
      console.log('[LeadCaptureService] Qualified:', result.qualifiedCount);
      console.log('[LeadCaptureService] Requested:', result.requested);
      console.log('[LeadCaptureService] Total Found:', result.totalFound);
      console.log('[LeadCaptureService] Total Scanned:', result.totalScanned);
      console.log('[LeadCaptureService] Rejected:', result.rejectedCount);
      console.log('[LeadCaptureService] Partial:', result.partial);
      console.log('[LeadCaptureService] Message:', result.message);
      console.log('[LeadCaptureService] ═══════════════════════════════════════');

      // Atualizar progresso para "finalizando"
      this.dataProvider.updateCaptureJob(jobId, {
        progress: 90,
        phaseLabel: 'Processando resultados...',
      });

      // Preparar stats para o job
      const stats = {
        requested: result.requested || quantity,
        candidatesFound: result.totalFound || 0,
        candidatesScanned: result.totalScanned || 0,
        domainValidated: result.totalScanned || 0,
        domainRejected: result.rejectedCount || 0,
        duplicatesRemoved: 0,
        leadsQualified: result.qualifiedCount || 0,
        attempts: 1,
        errors: [],
        rejectionReasons: result.rejectionReasons || {},
      };

      // Atualizar job final
      this.dataProvider.updateCaptureJob(jobId, {
        status: result.success ? 'completed' : 'failed',
        progress: 100,
        total_found: result.totalFound || 0,
        total_valid: result.qualifiedCount || 0,
        phaseLabel: result.message || (result.qualifiedCount > 0
          ? `${result.qualifiedCount} leads qualificados`
          : 'Nenhum lead encontrado'),
        stats,
      });

      // Adicionar resultados ao job
      if (result.qualified && result.qualified.length > 0) {
        this.dataProvider.addCaptureResults(jobId, result.qualified);
      }

      console.log('[LeadCaptureService] CAPTURA CONCLUÍDA');
      console.log('[LeadCaptureService] Leads retornados:', result.qualified?.length || 0);

      return {
        success: result.success,
        leads: result.qualified || [],
        partial: result.partial || false,
        stats,
        message: result.message,
        requested: result.requested,
        qualifiedCount: result.qualifiedCount,
        totalFound: result.totalFound,
        totalScanned: result.totalScanned,
        rejectedCount: result.rejectedCount,
        rejectionReasons: result.rejectionReasons,
      };

    } catch (error) {
      console.error('[LeadCaptureService] ERRO:', error);

      let errorMessage = error.message;

      if (error.name === 'AbortError') {
        errorMessage = 'Tempo limite excedido. Tente novamente ou reduza a quantidade.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Não foi possível conectar ao servidor de captura. Verifique se o backend está rodando.';
      }

      this.dataProvider.updateCaptureJob(jobId, {
        status: 'failed',
        progress: 100,
        phaseLabel: 'Erro na captura: ' + errorMessage,
        error: errorMessage,
        stats: {
          requested: quantity,
          candidatesFound: 0,
          candidatesScanned: 0,
          domainValidated: 0,
          domainRejected: 0,
          leadsQualified: 0,
          errors: [errorMessage],
        },
      });

      return {
        success: false,
        leads: [],
        partial: true,
        stats: {
          requested: quantity,
          candidatesFound: 0,
          candidatesScanned: 0,
          domainValidated: 0,
          domainRejected: 0,
          leadsQualified: 0,
          errors: [errorMessage],
        },
        error: errorMessage,
        message: errorMessage,
      };
    }
  }

  // ============================================
  // PROGRESSO PULSE - para UI visual
  // ============================================
  startProgressPulse(jobId, quantity) {
    let progress = 10;

    const interval = setInterval(() => {
      if (progress < 85) {
        // Progresso mais rápido no início, mais lento depois
        progress = Math.min(85, progress + (progress < 40 ? 8 : progress < 60 ? 5 : 2));
      }
      this.dataProvider.updateCaptureJob(jobId, {
        progress,
        phaseLabel: progress < 30
          ? 'Conectando com servidor...'
          : progress < 60
            ? 'Buscando candidatos...'
            : progress < 85
              ? 'Validando leads...'
              : 'Finalizando...',
        stats: {
          requested: quantity,
          candidatesFound: Math.round(quantity * (progress / 100) * 1.5),
          leadsQualified: Math.round(quantity * (progress / 100)),
        },
      });
    }, 1000);

    return () => clearInterval(interval);
  }

  // ============================================
  // VERIFICAR DISPONIBILIDADE DO BACKEND
  // ============================================
  async checkBackendHealth() {
    try {
      const apiBase = this.isDev
        ? 'http://localhost:3001'
        : window.location.origin;

      const response = await fetch(`${apiBase}/api/system-health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          available: true,
          captureConfigured: data.services?.capture?.bingApiConfigured ||
                           data.services?.capture?.googlePlacesConfigured ||
                           data.services?.capture?.fallbackSearchEnabled,
          services: data.services,
        };
      }

      return { available: false, captureConfigured: false };
    } catch {
      return { available: false, captureConfigured: false };
    }
  }
}

export default LeadCaptureService;
