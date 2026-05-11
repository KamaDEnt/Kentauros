import { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useI18n } from '../../context/I18nContext';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import { 
  Zap, 
  Search, 
  MapPin, 
  Target, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Building2, 
  Globe,
  Loader2,
  Trophy,
  Users,
  Send,
  Edit3,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Palette,
  Wrench,
  LayoutTemplate,
  ShieldCheck
} from 'lucide-react';
import { LeadCaptureService } from '../../services/leadCapture/LeadCaptureService';
import { emailService } from '../../services/leadCapture/EmailService';
import { getPaginatedLeadResults } from './capturePagination';
import { CAPTURE_METRICS, calculateAiDevelopmentEstimatedValue } from '../../services/leadCapture/leadCaptureInsights';
import { assertCaptureAvailableForUser, getCaptureIdentity } from '../../services/leadCapture/captureOwnership';
import { buildGmailSafeSendPolicy, buildProspectingPlan, createLeadInteraction } from '../../services/leadCapture/leadConversionStrategy';

const defaultEmailBody = `Olá, equipe da [Nome do cliente capturado],

Analisei o site de vocês e identifiquei alguns pontos que podem estar dificultando o caminho entre o visitante interessado e o contato comercial.

São ajustes de apresentação, clareza e navegação que normalmente passam despercebidos no dia a dia, mas que influenciam diretamente na taxa de conversão do seu negócio.

Gostaria de apresentar um relatório gratuito de 15 minutos com essas oportunidades de otimização.

Qual o melhor horário para conversarmos esta semana?`;

const defaultEmailSubject = `[Nome do lead capturado]: pontos do site que podem estar reduzindo conversões`;

const improvedDefaultEmailBody = defaultEmailBody.replace(defaultEmailBody, `Olá, equipe da [Nome do cliente capturado],

Passei rapidamente pelo site [Site capturado] e percebi algumas oportunidades simples para transformar mais visitantes em contatos comerciais.

Em especial, vi espaço para melhorar:

[Pontos de melhoria]

Preparei um diagnóstico gratuito e objetivo com sugestões práticas para aumentar a clareza, a confiança e os pedidos de contato pelo site.

Faz sentido eu enviar esse diagnóstico para vocês ou marcarmos uma conversa rápida esta semana?`);

const improvedDefaultEmailSubject = `[Nome do lead capturado]: oportunidade rápida no site`;

const NICHE_SUGGESTIONS = [
  "Escritórios de Advocacia",
  "Academias",
  "Clínicas Médicas",
  "Contabilidade",
  "Imobiliárias",
  "Restaurantes",
  "E-commerce",
  "Tecnologia",
  "Agências de Marketing",
  "Engenharia e Construção"
];

const LOCATION_SUGGESTIONS = [
  "São Paulo, SP",
  "Rio de Janeiro, RJ",
  "Belo Horizonte, MG",
  "Curitiba, PR",
  "Porto Alegre, RS",
  "Brasília, DF",
  "Salvador, BA",
  "Fortaleza, CE",
  "Brasil"
];

const METRIC_ICONS = {
  website_reformulation: Palette,
  new_website: LayoutTemplate,
  website_correction: Wrench,
};

const GMAIL_POLICY = buildGmailSafeSendPolicy({ workspaceAccount: true, coldOutreach: true });
const GMAIL_SEND_DELAY_MS = GMAIL_POLICY.minDelaySeconds * 1000;

const CaptureModal = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const { 
    startCaptureJob, 
    updateCaptureJob, 
    addCaptureResults, 
    captureJobs, 
    captureResults, 
    leads,
    addLead,
    updateLead
  } = useData();
  const { user, addNotification } = useApp();
  
  const [step, setStep] = useState(1);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [resultsPage, setResultsPage] = useState(1);
  const [showNicheSuggestions, setShowNicheSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  
  // Email state
  const [emailTemplate, setEmailTemplate] = useState({
    subject: improvedDefaultEmailSubject,
    body: improvedDefaultEmailBody
  });
  const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0, status: 'idle', nextIn: 0 });
  const [sendingLogs, setSendingLogs] = useState([]);
  
  // Form state
  const [config, setConfig] = useState({
    captureMetric: 'website_reformulation',
    niche: '',
    location: '',
    quantity: 20,
    sources: ['Google Maps', 'LinkedIn'],
    contactRequirements: {
      email: true,
      phone: false,
      whatsapp: false,
      website: false
    }
  });

  const currentJob = useMemo(() => 
    captureJobs.find(j => j.id === currentJobId), 
    [captureJobs, currentJobId]
  );

  const captureProgress = Math.min(100, Math.max(0, Math.round(currentJob?.progress || 0)));
  const capturePhaseLabel = currentJob?.phaseLabel || (
    captureProgress < 25 ? 'Preparando fontes de captura' :
    captureProgress < 55 ? 'Consultando Google Maps e buscadores' :
    captureProgress < 85 ? 'Validando sites e contatos' :
    'Calculando score de qualidade'
  );

  const results = useMemo(() => 
    captureResults.filter(r => r.job_id === currentJobId),
    [captureResults, currentJobId]
  );

  const paginatedResults = useMemo(
    () => getPaginatedLeadResults(results, resultsPage),
    [results, resultsPage]
  );

  const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('.local');
  const apiBase = isProduction ? window.location.origin : 'http://localhost:3001';

  const captureService = useMemo(() => new LeadCaptureService({
    updateCaptureJob,
    addCaptureResults
  }, apiBase), [updateCaptureJob, addCaptureResults]);

  const handleStartCapture = async () => {
    if (!config.niche || !config.location) {
      addNotification(
        t('common.error', 'Erro'), 
        t('leads.capture.notifications.error.missingFields', 'Nicho e Localização são obrigatórios.'), 
        'error'
      );
      return;
    }

    const jobId = startCaptureJob(config);
    setCurrentJobId(jobId);
    setResultsPage(1);
    setSelectedLeads([]);
    setStep(2);
    
    captureService.runJob(jobId, config);
  };

  useEffect(() => {
    if (currentJob?.status === 'completed' && step === 2) {
      setTimeout(() => setStep(3), 800);
    }
    if (currentJob?.status === 'failed' && step === 2) {
      addNotification(t('common.error'), currentJob?.error || 'A captura falhou. Revise os filtros ou tente novamente.', 'error');
    }
  }, [currentJob?.status, currentJob?.error, step, addNotification, t]);

  useEffect(() => {
    if (resultsPage !== paginatedResults.currentPage) {
      setResultsPage(paginatedResults.currentPage);
    }
  }, [paginatedResults.currentPage, resultsPage]);

  const handleToggleLead = (leadId) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    const validLeads = results.filter(l => l.isValid && l.email).map(l => l.id);
    if (selectedLeads.length === validLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(validLeads);
    }
  };

  const handleImportLeads = async () => {
    const leadsToImport = results.filter(r => selectedLeads.includes(r.id));
    const imported = [];
    let skippedAlreadyClaimed = 0;
    let skippedAlreadyImported = 0;
    
    for (const lead of leadsToImport) {
      const claim = await assertCaptureAvailableForUser(lead, user);
      if (!claim.claimed) {
        if (claim.reason === 'already_claimed') {
          skippedAlreadyClaimed += 1;
        }
        continue;
      }

      const alreadyImported = leads.some(existing => {
        const sameIdentity = existing.captureIdentity && existing.captureIdentity === claim.identity;
        const sameWebsite = existing.website && getCaptureIdentity(existing) === claim.identity;
        const sameEmail = existing.email && lead.email && existing.email.toLowerCase() === lead.email.toLowerCase();
        return sameIdentity || sameWebsite || sameEmail;
      }) || imported.some(existing => existing.captureIdentity === claim.identity);

      if (alreadyImported) {
        skippedAlreadyImported += 1;
        continue;
      }

      const estimatedValue = lead.estimatedValue || calculateAiDevelopmentEstimatedValue(lead, config.captureMetric);
      const prospectingPlan = lead.prospectingPlan || buildProspectingPlan(lead, config.captureMetric);
      const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedValue);
      const importedLead = addLead({
        company: lead.name,
        contact: lead.contact || 'Representante',
        email: lead.email || '',
        phone: lead.phone || '',
        website: lead.website || '',
        source: 'Captura Automática',
        value: estimatedValue,
        notes: `Capturado via automação (${config.niche} em ${config.location}). Valor estimado para desenvolvimento com IA: ${formattedValue}. Score: ${lead.score}/100`,
        industry: config.niche,
        status: prospectingPlan.nextStage,
        score: lead.score,
        stage: prospectingPlan.tier,
        conversionReadiness: prospectingPlan.readiness,
        prospectingPlan,
        conversionSignals: lead.conversionSignals || [],
        interactionHistory: [
          createLeadInteraction('captured', `Lead capturado via ${lead.source || 'automacao'} para ${prospectingPlan.offer.label}.`, {
            captureMetric: config.captureMetric,
            score: lead.score,
            estimatedValue,
          }),
        ],
        commercialOwnerUserId: user?.id,
        commercialOwnerEmail: user?.email,
        commercialOwnerName: user?.name,
        captureIdentity: claim.identity,
        captureMetric: config.captureMetric,
        pricingModel: 'ai_development'
      });

      imported.push({
        ...lead,
        importedLeadId: importedLead.id,
        estimatedValue,
        captureIdentity: claim.identity,
        commercialOwner: claim.owner,
        importedInteractionHistory: importedLead.interactionHistory || [],
      });
    }

    if (skippedAlreadyClaimed > 0) {
      addNotification(
        'Captura já vinculada',
        `${skippedAlreadyClaimed} lead(s) já estavam vinculados a outro comercial e foram ignorados.`,
        'warning'
      );
    }

    if (skippedAlreadyImported > 0) {
      addNotification(
        'Lead já importado',
        `${skippedAlreadyImported} lead(s) já constavam na sua carteira e foram ignorados.`,
        'warning'
      );
    }

    return imported;
  };

  const handlePreviewEmail = () => {
    if (selectedLeads.length === 0) return;
    setStep(4);
  };

  const handleGoBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const waitForNextSend = async (ms) => {
    const seconds = Math.ceil(ms / 1000);
    for (let remaining = seconds; remaining > 0; remaining--) {
      setSendingProgress(prev => ({ ...prev, status: 'waiting', nextIn: remaining }));
      await new Promise(res => setTimeout(res, 1000));
    }
    setSendingProgress(prev => ({ ...prev, status: 'sending', nextIn: 0 }));
  };

  const handleStartSending = async () => {
    const leadsToImport = await handleImportLeads(); // Import first before sending

    if (leadsToImport.length === 0) {
      addNotification(
        'Nenhum lead importado',
        'Os leads selecionados já estavam vinculados ou não puderam ser importados.',
        'error'
      );
      return;
    }
    
    setStep(5);
    setSendingProgress({ current: 0, total: leadsToImport.length, status: 'preparing', nextIn: 0 });
    setSendingLogs([]);

    for (let i = 0; i < leadsToImport.length; i++) {
      const lead = leadsToImport[i];
      
      try {
        setSendingProgress(prev => ({ ...prev, status: 'sending', nextIn: 0 }));
        const html = emailService.generateEmailHtml(lead, emailTemplate.body);
        const subject = emailTemplate.subject.replace(/\[Nome do lead capturado\]/g, lead.name);

        setSendingLogs(prev => [...prev, { id: lead.id, name: lead.name, status: 'sending' }]);
        
        // Ensure email exists before trying to send
        if (!lead.email) {
          throw new Error('No email found');
        }

        await emailService.sendEmail(lead.email, subject, html);
        updateLead(lead.importedLeadId, {
          status: 'qualified',
          emailStatus: 'sent',
          lastEmailSentAt: new Date().toISOString(),
          lastActivity: new Date().toISOString().split('T')[0],
          notes: `E-mail de prospecção enviado em ${new Date().toLocaleDateString('pt-BR')}. Capturado via automação (${config.niche} em ${config.location}). Score: ${lead.score}/100`,
          interactionHistory: [
            ...(leads.find(item => item.id === lead.importedLeadId)?.interactionHistory || lead.importedInteractionHistory || []),
            createLeadInteraction('email_sent', 'Primeiro e-mail de prospeccao enviado com diagnostico consultivo.', {
              subject,
              policy: GMAIL_POLICY,
            }),
          ],
        });
        
        setSendingLogs(prev => prev.map(log => 
          log.id === lead.id ? { ...log, status: 'success' } : log
        ));
      } catch (err) {
        setSendingLogs(prev => prev.map(log => 
          log.id === lead.id ? { ...log, status: 'error', error: err.message } : log
        ));
      }
      
      setSendingProgress(prev => ({ ...prev, current: i + 1 }));
      
      // Gmail-safe pacing for cold outreach: one recipient per minute.
      if (i < leadsToImport.length - 1) {
        await waitForNextSend(GMAIL_SEND_DELAY_MS);
      }
    }

    setSendingProgress(prev => ({ ...prev, status: 'completed', nextIn: 0 }));
    addNotification('Automação Concluída', 'O disparo de e-mails foi finalizado com sucesso.', 'success');
  };

  const renderStep1 = () => (
    <div className="animate-fade-in">
      <div className="grid grid-2 items-start">
        <div className="col-span-2 capture-metric-section">
          <label className="input-label">Metrica de captura</label>
          <div className="capture-metric-grid">
            {CAPTURE_METRICS.map(metric => {
              const MetricIcon = METRIC_ICONS[metric.value] || Target;
              const isSelected = config.captureMetric === metric.value;

              return (
                <button
                  key={metric.value}
                  type="button"
                  className={`capture-metric-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setConfig({ ...config, captureMetric: metric.value })}
                >
                  <span className="capture-metric-icon">
                    <MetricIcon size={18} />
                  </span>
                  <span className="capture-metric-copy">
                    <strong>{metric.label}</strong>
                    <small>{metric.description}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: showNicheSuggestions ? 1000 : 'auto' }}>
          <Input 
            id="niche-input"
            label={t('leads.capture.form.niche')}
            placeholder={t('leads.capture.form.nichePlaceholder')}
            value={config.niche}
            onChange={e => {
              setConfig({...config, niche: e.target.value});
              setShowNicheSuggestions(true);
            }}
            onFocus={() => setShowNicheSuggestions(true)}
            onClick={() => setShowNicheSuggestions(true)}
            onBlur={() => setShowNicheSuggestions(false)}
            icon={Target}
            autoComplete="off"
          />
          {showNicheSuggestions && NICHE_SUGGESTIONS.filter(n => n.toLowerCase().includes(config.niche.toLowerCase())).length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 9999,
              maxHeight: '220px',
              overflowY: 'auto',
            }}>
              {NICHE_SUGGESTIONS.filter(n => n.toLowerCase().includes(config.niche.toLowerCase())).map((niche, i) => (
                <div 
                  key={i}
                  className="select-option"
                  onMouseDown={e => {
                    e.preventDefault();
                    setConfig({...config, niche});
                    setShowNicheSuggestions(false);
                  }}
                >
                  <span>{niche}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={{ position: 'relative', zIndex: showLocationSuggestions ? 1000 : 'auto' }}>
          <Input 
            id="location-input"
            label={t('leads.capture.form.location')}
            placeholder={t('leads.capture.form.locationPlaceholder')}
            value={config.location}
            onChange={e => {
              setConfig({...config, location: e.target.value});
              setShowLocationSuggestions(true);
            }}
            onFocus={() => setShowLocationSuggestions(true)}
            onClick={() => setShowLocationSuggestions(true)}
            onBlur={() => setShowLocationSuggestions(false)}
            icon={MapPin}
            autoComplete="off"
          />
          {showLocationSuggestions && LOCATION_SUGGESTIONS.filter(l => l.toLowerCase().includes(config.location.toLowerCase())).length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 9999,
              maxHeight: '220px',
              overflowY: 'auto',
            }}>
              {LOCATION_SUGGESTIONS.filter(l => l.toLowerCase().includes(config.location.toLowerCase())).map((loc, i) => (
                <div 
                  key={i}
                  className="select-option"
                  onMouseDown={e => {
                    e.preventDefault();
                    setConfig({...config, location: loc});
                    setShowLocationSuggestions(false);
                  }}
                >
                  <span>{loc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      
        <Select 
          id="quantity-select"
          label={t('leads.capture.form.quantity')}
          value={config.quantity}
          onChange={val => setConfig({...config, quantity: parseInt(val)})}
          options={[
            { value: 10, label: '10 Leads' },
            { value: 20, label: '20 Leads' },
            { value: 50, label: '50 Leads' },
            { value: 100, label: '100 Leads' },
          ]}
        />
        <div className="flex flex-col gap-2">
          <label className="input-label">{t('leads.capture.form.requirements')}</label>
          <div className="capture-requirements-grid">
            {Object.keys(config.contactRequirements).map(req => (
              <label key={req} htmlFor={`req-${req}`} className={`capture-requirement-card ${config.contactRequirements[req] ? 'is-checked' : ''} ${req === 'email' ? 'is-locked' : ''}`}>
                <input 
                  id={`req-${req}`}
                  type="checkbox" 
                  checked={config.contactRequirements[req]}
                  onChange={e => setConfig({
                    ...config, 
                    contactRequirements: { ...config.contactRequirements, [req]: e.target.checked }
                  })}
                  disabled={req === 'email'} // Email is mandatory for this new feature
                />
                <span className="capture-requirement-check">
                  <CheckCircle2 size={14} />
                </span>
                <span className="capture-requirement-text">{t(`leads.capture.form.req.${req}`)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-8 animate-fade-in">
      <div className="capture-radar-container">
        <div className="radar-circle"></div>
        <div className="radar-circle delay-1"></div>
        <div className="radar-circle delay-2"></div>
        <Zap className="radar-icon" size={48} />
      </div>
      
      <div className="text-center w-full max-w-md">
        <h3 className="mb-2">{t('leads.capture.status.scanning')}</h3>
        <p className="text-muted text-sm mb-3">
          {capturePhaseLabel}
        </p>
        {currentJob?.status === 'failed' && (
          <div className="capture-failure-message">
            {currentJob?.error || 'Nao foi possivel concluir a captura com os filtros atuais.'}
          </div>
        )}
        <p className="text-muted text-xs mb-8">
          {config.niche} em {config.location} · meta de {config.quantity} leads qualificados
        </p>
        
        <div className="progress-bar-container h-3 mb-3">
          <div 
            className="progress-bar-fill bg-success shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
            style={{ width: `${captureProgress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs font-bold text-muted px-1">
          <span className="text-success">{captureProgress}%</span>
          <span>{Math.min(currentJob?.total_found || 0, config.quantity)} de {config.quantity} leads</span>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="capture-results-summary">
        <div className="capture-result-card">
          <div className="w-10 h-10 rounded-lg bg-info-dim flex items-center justify-center text-info">
            <Search size={20} />
          </div>
          <div>
            <div className="text-xs text-muted uppercase font-bold tracking-wider">{t('leads.capture.results.totalFound')}</div>
            <div className="text-xl font-extrabold">{results.length}</div>
          </div>
        </div>
        <div className="capture-result-card">
          <div className="w-10 h-10 rounded-lg bg-success-dim flex items-center justify-center text-success">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-xs text-muted uppercase font-bold tracking-wider">{t('leads.capture.results.validLeads')}</div>
            <div className="text-xl font-extrabold text-success">{currentJob?.total_valid || 0}</div>
          </div>
        </div>
        <div className="capture-result-card">
          <div className="w-10 h-10 rounded-lg bg-k-gold-dim flex items-center justify-center text-k-gold-500">
            <Trophy size={20} />
          </div>
          <div>
            <div className="text-xs text-muted uppercase font-bold tracking-wider">{t('leads.capture.results.avgScore')}</div>
            <div className="text-xl font-extrabold text-k-gold-500">
              {Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length) || 0}/100
            </div>
          </div>
        </div>
        <div className="capture-result-card">
          <div className="w-10 h-10 rounded-lg bg-k-gold-dim flex items-center justify-center text-k-gold-500">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-xs text-muted uppercase font-bold tracking-wider">Metrica</div>
            <div className="text-sm font-bold text-primary">
              {CAPTURE_METRICS.find(metric => metric.value === config.captureMetric)?.label}
            </div>
          </div>
        </div>
      </div>

      <div className="capture-results-panel">
      <div className="table-wrapper capture-results-table">
        <table className="table table-sm m-0">
          <thead className="sticky top-0 bg-surface z-10">
            <tr>
              <th className="w-12 text-center">
                <input 
                  type="checkbox" 
                  aria-label="Selecionar todos os leads válidos com email"
                  className="accent-k-gold-500"
                  checked={results.filter(l => l.isValid && l.email).length > 0 && selectedLeads.length === results.filter(l => l.isValid && l.email).length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>{t('leads.company')}</th>
              <th>{t('leads.score')}</th>
              <th>{t('leads.capture.results.channels')}</th>
              <th>{t('common.status')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedResults.pageResults.map(lead => (
              <tr key={lead.id} className={`${!lead.isValid || !lead.email ? 'opacity-50 grayscale-[0.5]' : 'hover:bg-bg-hover transition-colors'}`}>
                <td className="text-center">
                  <input 
                    type="checkbox" 
                    aria-label={`Selecionar ${lead.name}`}
                    className="accent-k-gold-500"
                    disabled={!lead.isValid || !lead.email}
                    checked={selectedLeads.includes(lead.id)}
                    onChange={() => handleToggleLead(lead.id)}
                  />
                </td>
                <td>
                  <div className="font-bold text-sm text-primary">{lead.name}</div>
                  <div className="text-[10px] text-muted flex items-center gap-1">
                    <Globe size={10} />
                    {lead.website ? (
                      <a
                        className="capture-lead-link"
                        href={lead.website}
                        target="_blank"
                        rel="noreferrer"
                        title={lead.website}
                      >
                        {lead.website}
                      </a>
                    ) : lead.location}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="progress-bar-container w-16 h-1.5">
                      <div 
                        className={`progress-bar-fill ${lead.score > 70 ? 'bg-success' : lead.score > 40 ? 'bg-warning' : 'bg-danger'}`} 
                        style={{ width: `${lead.score}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] font-bold font-mono">{lead.score}</span>
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    {lead.email && <Mail size={14} className="text-muted" title={lead.email} />}
                    {lead.phone && <Phone size={14} className="text-muted" title={lead.phone} />}
                    {lead.website && <Building2 size={14} className="text-muted" title={lead.website} />}
                  </div>
                </td>
                <td>
                  <Badge size="sm" variant={lead.isValid ? (lead.email ? 'success' : 'warning') : 'secondary'}>
                    {lead.isValid ? (lead.email ? t('leads.capture.results.valid') : 'Sem E-mail') : t('leads.capture.results.invalid')}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        <div className="capture-pagination">
          <div className="capture-pagination-range">
            Exibindo {paginatedResults.startItem}-{paginatedResults.endItem} de {paginatedResults.totalItems}
          </div>
          <div className="capture-pagination-controls">
            <Button
              variant="secondary"
              size="sm"
              className="btn-icon"
              aria-label="Pagina anterior"
              onClick={() => setResultsPage(page => Math.max(1, page - 1))}
              disabled={paginatedResults.currentPage === 1}
              icon={ChevronLeft}
            />
            <span className="capture-pagination-page">
              Pagina {paginatedResults.currentPage} de {paginatedResults.totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="btn-icon"
              aria-label="Proxima pagina"
              onClick={() => setResultsPage(page => Math.min(paginatedResults.totalPages, page + 1))}
              disabled={paginatedResults.currentPage === paginatedResults.totalPages}
              icon={ChevronRight}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const previewLead = results.find(l => l.id === selectedLeads[0]) || { name: 'Nome de Teste' };

    return (
      <div className="capture-email-layout animate-fade-in">
        {/* Editor de E-mail */}
        <div className="flex-1 flex flex-col gap-4">
          <h4 className="text-primary font-bold flex items-center gap-2">
            <Edit3 size={18} /> Configure a Mensagem Base
          </h4>
          <Input 
            id="email-subject"
            label="Assunto do E-mail"
            value={emailTemplate.subject}
            onChange={e => setEmailTemplate({...emailTemplate, subject: e.target.value})}
          />
          <div className="flex flex-col gap-2 flex-1">
            <label className="input-label">Corpo do E-mail</label>
            <textarea 
              className="input-field resize-none flex-1 font-mono text-sm"
              value={emailTemplate.body}
              onChange={e => setEmailTemplate({...emailTemplate, body: e.target.value})}
            />
            <span className="text-[10px] text-muted">Variáveis: [Nome do lead capturado], [Site capturado], [Problema encontrado]</span>
          </div>
        </div>

        {/* Preview do E-mail */}
        <div className="capture-email-preview-panel">
          <h4 className="text-primary font-bold flex items-center gap-2">
            <Search size={18} /> Preview (Exemplo com 1º Lead)
          </h4>
          <div className="capture-email-preview">
            <div className="capture-email-subject">
              <span className="text-muted">Assunto: </span>
              <strong className="text-primary">{emailTemplate.subject.replace(/\[Nome do lead capturado\]/g, previewLead.name)}</strong>
            </div>
            <div 
              className="capture-email-body"
              dangerouslySetInnerHTML={{ __html: emailService.generateEmailHtml(previewLead, emailTemplate.body, { signatureSrc: '/Assinatura.png' }) }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="flex flex-col items-center py-6 gap-6 animate-fade-in">
      <div className="text-center w-full max-w-lg">
        <h3 className="mb-2">Disparando E-mails...</h3>
        <p className="text-muted text-sm mb-6">
          Enviando para {sendingProgress.total} leads selecionados com intervalo de {GMAIL_SEND_DELAY_MS / 1000}s por e-mail.
          {sendingProgress.status === 'waiting' && sendingProgress.nextIn > 0 && (
            <span className="text-k-gold-500 font-bold"> Próximo envio em {sendingProgress.nextIn}s.</span>
          )}
        </p>
        
        <div className="progress-bar-container h-4 mb-3 rounded-full bg-raised overflow-hidden border border-border-default">
          <div 
            className="progress-bar-fill bg-k-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.4)] transition-all duration-500" 
            style={{ width: `${sendingProgress.total ? (sendingProgress.current / sendingProgress.total) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs font-bold text-muted px-1">
          <span className="text-k-gold-500">{sendingProgress.current} / {sendingProgress.total}</span>
          <span>{sendingProgress.total ? Math.round((sendingProgress.current / sendingProgress.total) * 100) : 0}%</span>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-raised border border-border-default rounded-xl p-4 max-h-[250px] overflow-y-auto">
        <h4 className="text-xs uppercase text-muted font-bold tracking-wider mb-3">Log de Envios</h4>
        <div className="flex flex-col gap-2">
          {sendingLogs.map((log, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-border-default/50 last:border-0">
              <span className="font-medium text-primary">{log.name}</span>
              {log.status === 'sending' && (
                <Badge variant="warning" size="sm" className="flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Enviando
                </Badge>
              )}
              {log.status === 'success' && (
                <Badge variant="success" size="sm" className="flex items-center gap-1">
                  <CheckCircle2 size={12} /> Sucesso
                </Badge>
              )}
              {log.status === 'error' && (
                <Badge variant="danger" size="sm" className="flex items-center gap-1" title={log.error}>
                  Falha
                </Badge>
              )}
            </div>
          ))}
          {sendingLogs.length === 0 && (
            <div className="text-center py-4 text-muted text-sm">Preparando disparos...</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-k-gold-dim flex items-center justify-center text-k-gold-500">
            <Send size={18} fill="currentColor" />
          </div>
          <span>Captura & Automação de E-mail</span>
        </div>
      }
      size={step >= 3 ? "xl" : "lg"}
      actions={
        <div className="flex justify-between items-center w-full">
          <div>
            {step >= 3 && step !== 5 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-raised rounded-full border border-border-default">
                <Users size={14} className="text-muted" />
                <span className="text-xs font-bold text-primary">
                  {selectedLeads.length} {t('leads.capture.results.selected')}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            {step === 2 && currentJob?.status === 'failed' && (
              <Button variant="secondary" onClick={() => setStep(1)} icon={ChevronLeft}>
                Voltar
              </Button>
            )}

            {step > 2 && step !== 5 && (
              <Button variant="secondary" onClick={handleGoBack} icon={ChevronLeft}>
                Voltar
              </Button>
            )}

            {step !== 5 && (
              <Button variant="secondary" onClick={onClose}>
                {t('common.cancel')}
              </Button>
            )}
            
            {step === 5 && sendingProgress.current === sendingProgress.total && (
              <Button variant="primary" onClick={onClose}>
                Concluir
              </Button>
            )}
            
            {step === 1 && (
              <Button variant="success" onClick={handleStartCapture} icon={Zap}>
                {t('leads.capture.modal.start')}
              </Button>
            )}

            {step === 2 && currentJob?.status === 'failed' && (
              <Button variant="success" onClick={handleStartCapture} icon={Zap}>
                Tentar novamente
              </Button>
            )}
            
            {step === 3 && (
              <Button 
                variant="primary" 
                onClick={handlePreviewEmail} 
                disabled={selectedLeads.length === 0}
                icon={Edit3}
              >
                Revisar E-mails
              </Button>
            )}

            {step === 4 && (
              <Button 
                variant="success" 
                onClick={handleStartSending} 
                icon={PlayCircle}
              >
                Iniciar Automação
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="capture-steps mb-6">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className={`step-item ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}>
            <div className="step-number">
              {step > s ? <CheckCircle2 size={16} /> : s}
            </div>
            <div className="step-label text-[10px]">
              {s === 1 ? 'Configurar' : s === 2 ? 'Escaneando' : s === 3 ? 'Seleção' : s === 4 ? 'Preview' : 'Disparo'}
            </div>
          </div>
        ))}
      </div>

      <div className="modal-content-body min-h-[300px]">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </Modal>
  );
};

export default CaptureModal;
