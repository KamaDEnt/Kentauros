// LeadCaptureService - Cliente frontend para captura de leads
// Este serviço apenas envia a configuração para o backend e exibe os resultados
// NÃO faz validação no browser - toda lógica está no backend

export const buildCaptureCompletion = (result = {}, fallbackQuantity = 20) => {
  const returnedLeads = Array.isArray(result.qualified) ? result.qualified : [];
  const totalValid = Number(result.qualifiedCount || returnedLeads.length || 0);
  const requested = Number(result.requested || fallbackQuantity || 20);
  const hasDisplayableLeads = returnedLeads.length > 0;
  const hasExactQuantity = totalValid === requested;
  const isSuccess = result.success === true || hasDisplayableLeads;
  const isPartialSuccess = isSuccess && !hasExactQuantity;
  const jobStatus = isSuccess ? 'completed' : 'failed';
  const phaseMessage = result.errorCode
    ? (hasDisplayableLeads
      ? `${returnedLeads.length} leads capturados para revisao`
      : `[${result.errorCode}] ${result.message}`)
    : (isSuccess
      ? `${totalValid} leads qualificados${isPartialSuccess ? ' para revisao' : ''}`
      : result.message || 'Captura falhou');

  return {
    returnedLeads,
    totalValid,
    requested,
    hasDisplayableLeads,
    hasExactQuantity,
    isSuccess,
    isPartialSuccess,
    jobStatus,
    phaseMessage,
    errorCode: hasDisplayableLeads ? null : (result.errorCode || null),
  };
};

export class LeadCaptureService {
  constructor(dataProvider, baseUrl) {
    this.dataProvider = dataProvider;
    this.baseUrl = baseUrl || '';
    this.isDev = import.meta.env?.DEV || process.env?.NODE_ENV === 'development';
  }

  // Clear capture results for a job
  clearResults(jobId) {
    if (this.dataProvider.clearCaptureResults) {
      this.dataProvider.clearCaptureResults(jobId);
    }
  }

  // ============================================
  // CAPTURA PRINCIPAL - chama backend
  // ============================================
  async runJob(jobId, config, captureRunId = null) {
    const {
      niche,
      location,
      quantity = 20,
      captureMetric = 'website_reformulation',
      contactRequirements = { email: true }
    } = config;

    console.log('[LeadCaptureService] ═══════════════════════════════════════');
    console.log('[LeadCaptureService] ENVIANDO CAPTURA PARA BACKEND');
    console.log('[LeadCaptureService] captureRunId:', captureRunId);
    console.log('[LeadCaptureService] Nicho:', niche);
    console.log('[LeadCaptureService] Localização:', location);
    console.log('[LeadCaptureService] Quantidade:', quantity);
    console.log('[LeadCaptureService] Métrica:', captureMetric);
    console.log('[LeadCaptureService] ═══════════════════════════════════════');

    // Clear previous results before starting new capture
    if (jobId) {
      this.clearResults(jobId);
    }

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
      const streamUrl = `${apiBase}/api/leads/capture-stream`;

      console.log('[LeadCaptureService] Chamando API:', apiUrl);

      // Atualizar progresso para "buscando"
      this.dataProvider.updateCaptureJob(jobId, {
        progress: 20,
        phaseLabel: 'Buscando candidatos no servidor...',
      });

      if (this.isDev) {
        const streamedResult = await this.runStreamingCapture({
          jobId,
          streamUrl,
          captureRunId,
          niche,
          location,
          quantity,
          captureMetric,
          contactRequirements,
        });
        if (streamedResult) return streamedResult;
      }

      // Fazer request para o backend
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min timeout for expanded validation

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          captureRunId,
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
        const errorData = await response.json().catch(() => null);
        console.error('[LeadCaptureService] Response status:', response.status);
        console.error('[LeadCaptureService] Response statusText:', response.statusText);
        console.error('[LeadCaptureService] Error data:', errorData);

        const errorMessage = errorData?.message
          || errorData?.error
          || `HTTP ${response.status}: ${response.statusText}`;

        if (response.status === 405) {
          throw new Error('A rota de captura não aceita POST. Verifique a implementação backend de /api/leads/capture.');
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      console.log('[LeadCaptureService] captureRunId enviado:', captureRunId);
      console.log('[LeadCaptureService] captureRunId recebido:', result.captureRunId);
      console.log('[LeadCaptureService] response completo:', JSON.stringify({
        success: result.success,
        captureRunId: result.captureRunId,
        qualifiedCount: result.qualifiedCount,
        message: result.message,
        errorCode: result.errorCode
      }));

      // CRITICAL: Validate response has captureRunId
      if (!result.captureRunId) {
        console.error('[LeadCaptureService] ERRO: Resposta da API sem captureRunId!');
        throw new Error('Resposta inválida da API: captureRunId ausente.');
      }

      // Validate response matches current captureRunId
      if (captureRunId && result.captureRunId !== captureRunId) {
        console.warn('[LeadCaptureService] Resultado antigo ignorado! Expected:', captureRunId, 'Got:', result.captureRunId);
        console.log('[LeadCaptureService] Resultado antigo ignorado: true');
        return {
          success: false,
          ignored: true,
          message: 'Resultado de captura anterior ignorado',
          captureRunId: result.captureRunId, // Preserve for debugging
        };
      }

      console.log('[LeadCaptureService] Resultado aplicado: true');

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
      console.log('[LeadCaptureService] Error Code:', result.errorCode);
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
        duplicatesRemoved: result.stats?.duplicatesRemoved || 0,
        leadsQualified: result.qualifiedCount || 0,
        attempts: 1,
        errors: [],
        rejectionReasons: result.rejectionReasons || {},
      };

      // CRITICAL: captura só é concluída quando vier exatamente a quantidade solicitada.
      const returnedLeads = result.qualified || [];
      const hasDisplayableLeads = returnedLeads.length > 0;
      const hasExactQuantity = (result.qualifiedCount || returnedLeads.length || 0) === (result.requested || quantity);
      const isSuccess = result.success === true || hasDisplayableLeads;
      const isPartialSuccess = isSuccess && !hasExactQuantity;
      const jobStatus = isSuccess ? 'completed' : 'failed';
      const phaseMessage = result.errorCode
        ? (hasDisplayableLeads
          ? `${returnedLeads.length} leads capturados para revisão`
          : `[${result.errorCode}] ${result.message}`)
        : (isSuccess
          ? `${result.qualifiedCount || returnedLeads.length} leads qualificados${isPartialSuccess ? ' para revisão' : ''}`
          : result.message || 'Captura falhou');

      // Atualizar job final
      this.dataProvider.updateCaptureJob(jobId, {
        status: jobStatus,
        progress: 100,
        total_found: result.totalFound || 0,
        total_valid: result.qualifiedCount || returnedLeads.length || 0,
        phaseLabel: phaseMessage,
        errorCode: hasDisplayableLeads ? null : (result.errorCode || null),
        stats,
        rawResponse: result, // Salvar resposta completa para debug
      });

      // Adicionar resultados ao job - apenas se houver leads
      if (returnedLeads.length > 0) {
        this.dataProvider.clearCaptureResults(jobId);
        this.dataProvider.addCaptureResults(jobId, returnedLeads);
      } else {
        // Limpar resultados se não houver leads
        this.dataProvider.clearCaptureResults(jobId);
      }

      console.log('[LeadCaptureService] CAPTURA CONCLUÍDA');
      console.log('[LeadCaptureService] Status:', jobStatus);
      console.log('[LeadCaptureService] Leads retornados:', result.qualified?.length || 0);

      return {
        success: isSuccess,
        leads: returnedLeads,
        partial: result.partial || isPartialSuccess || false,
        stats,
        message: result.message,
        errorCode: result.errorCode || null,
        requested: result.requested,
        qualifiedCount: result.qualifiedCount || returnedLeads.length,
        totalFound: result.totalFound,
        totalScanned: result.totalScanned,
        rejectedCount: result.rejectedCount,
        rejectionReasons: result.rejectionReasons,
      };

    } catch (error) {
      // Check if this error is due to abort (stale request)
      if (error.name === 'AbortError') {
        console.log('[LeadCaptureService] Requisição cancelada (captura mais recente iniciada)');
        this.dataProvider.updateCaptureJob(jobId, {
          status: 'cancelled',
          progress: 100,
          phaseLabel: 'Captura cancelada',
          error: 'Captura cancelada devido a nova requisição',
        });
        return {
          success: false,
          cancelled: true,
          message: 'Captura cancelada',
        };
      }

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

  async runStreamingCapture({
    jobId,
    streamUrl,
    captureRunId,
    niche,
    location,
    quantity,
    captureMetric,
    contactRequirements,
  }) {
    const response = await fetch(streamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        captureRunId,
        niche,
        location,
        quantity,
        captureMetric,
        contactRequirements,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line);

        if (event.captureRunId && event.captureRunId !== captureRunId) {
          console.warn('[LeadCaptureService] Evento de captura antiga ignorado:', event.captureRunId);
          continue;
        }

        if (event.type === 'progress') {
          this.dataProvider.updateCaptureJob(jobId, {
            status: 'running',
            progress: Math.max(5, Math.min(99, Number(event.progress || 0))),
            phaseLabel: event.phaseLabel || 'Captura em andamento...',
            total_found: event.total_found || 0,
            total_valid: event.total_valid || 0,
            stats: {
              requested: quantity,
              ...(event.stats || {}),
            },
          });
        }

        if (event.type === 'lead' && event.lead) {
          this.dataProvider.appendCaptureResults?.(jobId, [event.lead]);
          this.dataProvider.updateCaptureJob(jobId, {
            status: 'running',
            progress: Math.max(5, Math.min(99, Number(event.progress || 0))),
            phaseLabel: event.phaseLabel || `Lead validado: ${event.validCount || 0}/${quantity}`,
            total_valid: event.validCount || event.total_valid || 0,
            stats: {
              requested: quantity,
              leadsQualified: event.validCount || event.total_valid || 0,
            },
          });
        }

        if (event.type === 'final') {
          finalResult = event.result;
        }
      }
    }

    if (!finalResult) {
      throw new Error('Captura encerrada sem resultado final.');
    }

    const returnedLeads = finalResult.qualified || [];
    const hasDisplayableLeads = returnedLeads.length > 0;
    const hasExactQuantity = (finalResult.qualifiedCount || returnedLeads.length || 0) === (finalResult.requested || quantity);
    const isSuccess = finalResult.success === true || hasDisplayableLeads;
    const isPartialSuccess = isSuccess && !hasExactQuantity;
    const jobStatus = isSuccess ? 'completed' : 'failed';
    const stats = {
      requested: finalResult.requested || quantity,
      candidatesFound: finalResult.stats?.candidatesFound || finalResult.totalScanned || 0,
      candidatesScanned: finalResult.totalScanned || 0,
      domainValidated: finalResult.stats?.domainValidated || finalResult.qualifiedCount || 0,
      domainRejected: finalResult.rejectedCount || 0,
      duplicatesRemoved: finalResult.stats?.duplicatesRemoved || 0,
      leadsQualified: finalResult.qualifiedCount || 0,
      attempts: 1,
      errors: [],
      rejectionReasons: finalResult.rejectionReasons || finalResult.stats?.rejectionReasons || {},
    };

    this.dataProvider.updateCaptureJob(jobId, {
      status: jobStatus,
      progress: 100,
      total_found: finalResult.totalFound || 0,
      total_valid: finalResult.qualifiedCount || returnedLeads.length || 0,
      phaseLabel: isSuccess
        ? `${finalResult.qualifiedCount || returnedLeads.length} leads qualificados${isPartialSuccess ? ' para revisão' : ''}`
        : finalResult.message || 'Captura falhou',
      errorCode: hasDisplayableLeads ? null : (finalResult.errorCode || null),
      error: isSuccess ? null : finalResult.message,
      stats,
      rawResponse: finalResult,
    });

    if (isSuccess && returnedLeads.length > 0) {
      this.dataProvider.clearCaptureResults(jobId);
      this.dataProvider.addCaptureResults(jobId, returnedLeads);
    } else if (returnedLeads.length > 0) {
      this.dataProvider.appendCaptureResults?.(jobId, returnedLeads);
    }

    return {
      success: isSuccess,
      leads: returnedLeads,
      partial: finalResult.partial || isPartialSuccess || false,
      stats,
      message: finalResult.message,
      errorCode: finalResult.errorCode || null,
      requested: finalResult.requested,
      qualifiedCount: finalResult.qualifiedCount || returnedLeads.length,
      totalFound: finalResult.totalFound,
      totalScanned: finalResult.totalScanned,
      rejectedCount: finalResult.rejectedCount,
      rejectionReasons: finalResult.rejectionReasons,
    };
  }

  // ============================================
  // PROGRESSO PULSE - para UI visual
  // ============================================
  startProgressPulse(jobId, quantity) {
    let progress = 10;

    const interval = setInterval(() => {
      if (progress < 85) {
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
