import { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useI18n } from '../../context/I18nContext';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import { CustomDropdown } from '../ui/CustomDropdown';
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
  ShieldCheck,
  Gavel,
  Dumbbell,
  Stethoscope,
  Calculator,
  Home,
  UtensilsCrossed,
  ShoppingBag,
  Code,
  Megaphone,
  Hammer,
  Heart,
  Scissors,
  Car,
  Shirt,
  Lightbulb,
  Users2,
  GraduationCap,
  PawPrint,
  Hotel,
  Camera,
  Shield,
  Sun,
  Truck,
  Factory,
  Pill,
  Armchair,
  UserCheck,
  Bird,
  Bookmark,
  Clock,
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

// Nichos expandidos com ícones
const NICHE_OPTIONS = [
  // Serviços Profissionais
  { value: 'escritórios de advocacia', label: 'Escritórios de Advocacia', icon: <Gavel size={16} />, category: 'Serviços Profissionais', searchTerms: ['advocacia', 'advogado', 'jurídico', 'direito'] },
  { value: 'contabilidade', label: 'Contabilidade', icon: <Calculator size={16} />, category: 'Serviços Profissionais', searchTerms: ['contábil', 'contador', 'fiscal'] },
  { value: 'consultorias', label: 'Consultorias', icon: <Lightbulb size={16} />, category: 'Serviços Profissionais', searchTerms: ['consultoria', 'consultor', 'assessoria'] },
  { value: 'engenharias', label: 'Engenharias e Arquitetura', icon: <Hammer size={16} />, category: 'Serviços Profissionais', searchTerms: ['engenharia', 'arquitetura', 'projeto'] },

  // Saúde e Bem-estar
  { value: 'clínicas médicas', label: 'Clínicas Médicas', icon: <Stethoscope size={16} />, category: 'Saúde', searchTerms: ['clínica', 'médico', 'saúde'] },
  { value: 'dentistas', label: 'Dentistas', icon: <Stethoscope size={16} />, category: 'Saúde', searchTerms: ['dentista', 'odontologia', 'dental'] },
  { value: 'psicólogos', label: 'Psicólogos', icon: <Heart size={16} />, category: 'Saúde', searchTerms: ['psicólogo', 'psicologia', 'terapia'] },
  { value: 'clínicas veterinárias', label: 'Clínicas Veterinárias', icon: <PawPrint size={16} />, category: 'Saúde', searchTerms: ['veterinário', 'pet', 'animal'] },
  { value: 'nutricionistas', label: 'Nutricionistas', icon: <Heart size={16} />, category: 'Saúde', searchTerms: ['nutrição', 'nutricionista', 'dieta'] },

  // Fitness e Beleza
  { value: 'academias', label: 'Academias', icon: <Dumbbell size={16} />, category: 'Fitness', searchTerms: ['academia', 'ginástica', 'musculação'] },
  { value: 'crossfit', label: 'CrossFit', icon: <Dumbbell size={16} />, category: 'Fitness', searchTerms: ['crossfit', 'cross box', 'funcional'] },
  { value: 'personal trainers', label: 'Personal Trainers', icon: <UserCheck size={16} />, category: 'Fitness', searchTerms: ['personal', 'treino', 'personal trainer'] },
  { value: 'salões de beleza', label: 'Salões de Beleza', icon: <Scissors size={16} />, category: 'Beleza', searchTerms: ['salão', 'beleza', 'cabelo'] },
  { value: 'barbearias', label: 'Barbearias', icon: <Scissors size={16} />, category: 'Beleza', searchTerms: ['barbearia', 'barbeiro', 'barba'] },
  { value: 'estéticas', label: 'Clínicas Estéticas', icon: <Heart size={16} />, category: 'Beleza', searchTerms: ['estética', 'estético', 'beleza'] },

  // Imóveis e Construção
  { value: 'imobiliárias', label: 'Imobiliárias', icon: <Home size={16} />, category: 'Imóveis', searchTerms: ['imobiliária', 'imóvel', 'corretora'] },
  { value: 'construtoras', label: 'Construtoras', icon: <Hammer size={16} />, category: 'Imóveis', searchTerms: ['construtora', 'construção', 'obra'] },
  { value: 'móveis planejados', label: 'Móveis Planejados', icon: <Armchair size={16} />, category: 'Imóveis', searchTerms: ['móveis', 'planejado', 'marcenaria'] },
  { value: 'marcenarias', label: 'Marcenarias', icon: <Hammer size={16} />, category: 'Imóveis', searchTerms: ['marcenaria', 'móvel', 'madeira'] },

  // Alimentação
  { value: 'restaurantes', label: 'Restaurantes', icon: <UtensilsCrossed size={16} />, category: 'Alimentação', searchTerms: ['restaurante', 'comida', 'gastronomia'] },
  { value: 'hamburguerias', label: 'Hamburguerias', icon: <UtensilsCrossed size={16} />, category: 'Alimentação', searchTerms: ['hambúrguer', 'hamburgueria', 'burger'] },
  { value: 'pizzarias', label: 'Pizzarias', icon: <UtensilsCrossed size={16} />, category: 'Alimentação', searchTerms: ['pizza', 'pizzaria', 'italiano'] },
  { value: 'cafeterias', label: 'Cafeterias', icon: <UtensilsCrossed size={16} />, category: 'Alimentação', searchTerms: ['café', 'cafeteria', 'padaria'] },

  // Varejo
  { value: 'lojas de roupas', label: 'Lojas de Roupas', icon: <Shirt size={16} />, category: 'Varejo', searchTerms: ['roupa', 'moda', 'boutique'] },
  { value: 'ecommerce', label: 'E-commerce', icon: <ShoppingBag size={16} />, category: 'Varejo', searchTerms: ['e-commerce', 'loja virtual', 'online'] },
  { value: 'farmácias', label: 'Farmácias', icon: <Pill size={16} />, category: 'Varejo', searchTerms: ['farmácia', 'medicamento', 'drogaria'] },
  { value: 'supermercados', label: 'Supermercados', icon: <ShoppingBag size={16} />, category: 'Varejo', searchTerms: ['supermercado', 'mercado', 'atacado'] },
  { value: 'óticas', label: 'Óticas', icon: <ShoppingBag size={16} />, category: 'Varejo', searchTerms: ['ótica', 'óculos', 'lente'] },

  // Automotivo
  { value: 'oficinas mecânicas', label: 'Oficinas Mecânicas', icon: <Car size={16} />, category: 'Automotivo', searchTerms: ['oficina', 'mecânico', 'carro'] },
  { value: 'auto elétricas', label: 'Auto Elétricas', icon: <Car size={16} />, category: 'Automotivo', searchTerms: ['elétrica', 'auto', 'bateria'] },
  { value: 'concessionárias', label: 'Concessionárias', icon: <Car size={16} />, category: 'Automotivo', searchTerms: ['concessionária', 'veículo', 'carro'] },

  // Tecnologia
  { value: 'empresas de tecnologia', label: 'Empresas de Tecnologia', icon: <Code size={16} />, category: 'Tecnologia', searchTerms: ['tech', 'tecnologia', 'software'] },
  { value: 'software house', label: 'Software House', icon: <Code size={16} />, category: 'Tecnologia', searchTerms: ['software', 'dev', 'desenvolvimento'] },

  // Marketing e Comunicação
  { value: 'agências de marketing', label: 'Agências de Marketing', icon: <Megaphone size={16} />, category: 'Marketing', searchTerms: ['marketing', 'agência', 'publicidade'] },

  // Educação
  { value: 'escolas', label: 'Escolas', icon: <GraduationCap size={16} />, category: 'Educação', searchTerms: ['escola', 'ensino', 'educação'] },
  { value: 'cursos online', label: 'Cursos Online', icon: <GraduationCap size={16} />, category: 'Educação', searchTerms: ['curso', 'online', 'ead'] },
  { value: 'infoprodutores', label: 'Infoprodutores', icon: <GraduationCap size={16} />, category: 'Educação', searchTerms: ['info', 'produtor', 'curso digital'] },

  // Turismo e Eventos
  { value: 'hotéis', label: 'Hotéis', icon: <Hotel size={16} />, category: 'Turismo', searchTerms: ['hotel', 'hospedagem', 'pousada'] },
  { value: 'pousadas', label: 'Pousadas', icon: <Hotel size={16} />, category: 'Turismo', searchTerms: ['pousada', 'hospedagem', 'turismo'] },
  { value: 'eventos', label: 'Eventos', icon: <Camera size={16} />, category: 'Turismo', searchTerms: ['evento', 'festa', 'casamento'] },

  // Serviços Diversos
  { value: 'segurança eletrônica', label: 'Segurança Eletrônica', icon: <Shield size={16} />, category: 'Serviços', searchTerms: ['segurança', 'câmera', 'alarme'] },
  { value: 'energia solar', label: 'Energia Solar', icon: <Sun size={16} />, category: 'Serviços', searchTerms: ['solar', 'painel', 'fotovoltaico'] },
  { value: 'financeiras', label: 'Financeiras', icon: <Calculator size={16} />, category: 'Serviços', searchTerms: ['financeira', 'crédito', 'empréstimo'] },
  { value: 'seguradoras', label: 'Seguradoras', icon: <Shield size={16} />, category: 'Serviços', searchTerms: ['seguradora', 'seguro', 'seguro'] },
  { value: 'transportadoras', label: 'Transportadoras', icon: <Truck size={16} />, category: 'Serviços', searchTerms: ['transporte', 'frete', 'logística'] },
  { value: 'logística', label: 'Logística', icon: <Truck size={16} />, category: 'Serviços', searchTerms: ['logística', 'armazenamento', 'distribuição'] },
  { value: 'distribuidoras', label: 'Distribuidoras', icon: <Factory size={16} />, category: 'Serviços', searchTerms: ['distribuidora', 'atacado', 'distribuição'] },
  { value: 'indústrias', label: 'Indústrias', icon: <Factory size={16} />, category: 'Serviços', searchTerms: ['indústria', 'fábrica', 'manufactura'] },
  { value: 'pet shops', label: 'Pet Shops', icon: <Bird size={16} />, category: 'Serviços', searchTerms: ['pet', 'animal', 'cachorro'] },
  { value: 'turismo', label: 'Turismo', icon: <Hotel size={16} />, category: 'Turismo', searchTerms: ['turismo', 'viagem', 'pacote'] },
];

// Localizações expandidas
const LOCATION_OPTIONS = [
  // Capitais
  { value: 'São Paulo, SP', label: 'São Paulo, SP', icon: <MapPin size={14} />, category: 'Capitais', count: 'Alta' },
  { value: 'Rio de Janeiro, RJ', label: 'Rio de Janeiro, RJ', icon: <MapPin size={14} />, category: 'Capitais', count: 'Alta' },
  { value: 'Belo Horizonte, MG', label: 'Belo Horizonte, MG', icon: <MapPin size={14} />, category: 'Capitais', count: 'Alta' },
  { value: 'Brasília, DF', label: 'Brasília, DF', icon: <MapPin size={14} />, category: 'Capitais', count: 'Alta' },
  { value: 'Salvador, BA', label: 'Salvador, BA', icon: <MapPin size={14} />, category: 'Capitais', count: 'Média' },
  { value: 'Curitiba, PR', label: 'Curitiba, PR', icon: <MapPin size={14} />, category: 'Capitais', count: 'Alta' },
  { value: 'Porto Alegre, RS', label: 'Porto Alegre, RS', icon: <MapPin size={14} />, category: 'Capitais', count: 'Média' },
  { value: 'Recife, PE', label: 'Recife, PE', icon: <MapPin size={14} />, category: 'Capitais', count: 'Média' },
  { value: 'Fortaleza, CE', label: 'Fortaleza, CE', icon: <MapPin size={14} />, category: 'Capitais', count: 'Média' },
  { value: 'Goiânia, GO', label: 'Goiânia, GO', icon: <MapPin size={14} />, category: 'Capitais', count: 'Média' },
  { value: 'Manaus, AM', label: 'Manaus, AM', icon: <MapPin size={14} />, category: 'Capitais', count: 'Baixa' },
  { value: 'Belém, PA', label: 'Belém, PA', icon: <MapPin size={14} />, category: 'Capitais', count: 'Baixa' },
  { value: 'Florianópolis, SC', label: 'Florianópolis, SC', icon: <MapPin size={14} />, category: 'Capitais', count: 'Média' },

  // Grandes Cidades - SP
  { value: 'Campinas, SP', label: 'Campinas, SP', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Alta' },
  { value: 'Santos, SP', label: 'Santos, SP', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Média' },
  { value: 'Ribeirão Preto, SP', label: 'Ribeirão Preto, SP', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Alta' },
  { value: 'São José dos Campos, SP', label: 'São José dos Campos, SP', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Alta' },
  { value: 'Sorocaba, SP', label: 'Sorocaba, SP', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Média' },

  // Grandes Cidades - SC
  { value: 'Joinville, SC', label: 'Joinville, SC', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Alta' },
  { value: 'Blumenau, SC', label: 'Blumenau, SC', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Média' },

  // Grandes Cidades - PR
  { value: 'Londrina, PR', label: 'Londrina, PR', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Média' },
  { value: 'Maringá, PR', label: 'Maringá, PR', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Média' },

  // Grandes Cidades - MG
  { value: 'Uberlândia, MG', label: 'Uberlândia, MG', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Alta' },
  { value: 'Juiz de Fora, MG', label: 'Juiz de Fora, MG', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Média' },
  { value: 'Contagem, MG', label: 'Contagem, MG', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Média' },

  // Grandes Cidades - RJ
  { value: 'Niterói, RJ', label: 'Niterói, RJ', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Média' },
  { value: 'São Gonçalo, RJ', label: 'São Gonçalo, RJ', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Média' },

  // Grandes Cidades - BA
  { value: 'Feira de Santana, BA', label: 'Feira de Santana, BA', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Média' },
  { value: 'Vitória da Conquista, BA', label: 'Vitória da Conquista, BA', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Baixa' },

  // Grandes Cidades - PE
  { value: 'Jaboatão dos Guararapes, PE', label: 'Jaboatão dos Guararapes, PE', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Média' },
  { value: 'Olinda, PE', label: 'Olinda, PE', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Baixa' },

  // Grandes Cidades - CE
  { value: 'Caucaia, CE', label: 'Caucaia, CE', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Baixa' },
  { value: 'Juazeiro do Norte, CE', label: 'Juazeiro do Norte, CE', icon: <MapPin size={14} />, category: 'Grandes Cidades', count: 'Baixa' },

  // Regiões
  { value: 'Sudeste', label: 'Sudeste (SP, RJ, MG, ES)', icon: <MapPin size={14} />, category: 'Regiões', count: 'Muito Alta' },
  { value: 'Sul', label: 'Sul (PR, SC, RS)', icon: <MapPin size={14} />, category: 'Regiões', count: 'Alta' },
  { value: 'Nordeste', label: 'Nordeste (MA, PI, CE, RN, PB, PE, AL, SE, BA)', icon: <MapPin size={14} />, category: 'Regiões', count: 'Alta' },
  { value: 'Centro-Oeste', label: 'Centro-Oeste (DF, GO, MT, MS)', icon: <MapPin size={14} />, category: 'Regiões', count: 'Média' },
  { value: 'Norte', label: 'Norte (AM, PA, AC, RO, RR, AP, TO)', icon: <MapPin size={14} />, category: 'Regiões', count: 'Baixa' },

  // Brasil
  { value: 'Brasil', label: 'Brasil (Todo o território)', icon: <MapPin size={14} />, category: 'Nacional', count: 'Muito Alta' },
];

// Quantidade de leads
const QUANTITY_OPTIONS = [
  { value: 10, label: '10 Leads', description: 'Para teste rápido' },
  { value: 20, label: '20 Leads', description: 'Recomendado para início' },
  { value: 30, label: '30 Leads', description: 'Boa quantidade inicial' },
  { value: 50, label: '50 Leads', description: 'Para prospecção ampla' },
  { value: 100, label: '100 Leads', description: 'Campanha completa' },
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
    clearCaptureResults,
    clearAllCaptureJobs,
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

  // Unique ID for each capture run to prevent race conditions
  const [captureRunId, setCaptureRunId] = useState(null);
  const [currentCaptureConfig, setCurrentCaptureConfig] = useState(null);

  // AbortController for canceling previous requests
  const captureAbortController = useRef(null);

  // Email state
  const [emailTemplate, setEmailTemplate] = useState({
    subject: improvedDefaultEmailSubject,
    body: improvedDefaultEmailBody
  });
  const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0, status: 'idle', nextIn: 0 });
  const [sendingLogs, setSendingLogs] = useState([]);

  // Capture state
  const [captureConfig, setCaptureConfig] = useState({
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

  // Debug state
  const [captureDebug, setCaptureDebug] = useState({
    candidatesGenerated: 0,
    candidatesValidated: 0,
    totalResults: 0,
    lastError: null,
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

  // Filter results for current job only and validate against capture run
  const results = useMemo(() => {
    if (!currentJobId) return [];
    return captureResults.filter(r => r.job_id === currentJobId);
  }, [captureResults, currentJobId]);

  const paginatedResults = useMemo(
    () => getPaginatedLeadResults(results, resultsPage),
    [results, resultsPage]
  );

  const captureService = useMemo(() => new LeadCaptureService({
    updateCaptureJob,
    addCaptureResults,
    clearCaptureResults
  }), [updateCaptureJob, addCaptureResults, clearCaptureResults]);

  // Find labels for selected values
  const selectedNicheLabel = NICHE_OPTIONS.find(n => n.value === captureConfig.niche)?.label || '';
  const selectedLocationLabel = LOCATION_OPTIONS.find(l => l.value === captureConfig.location)?.label || '';
  const selectedQuantityLabel = QUANTITY_OPTIONS.find(q => q.value === captureConfig.quantity)?.label || '';

  const handleStartCapture = async () => {
    if (!captureConfig.niche || !captureConfig.location) {
      addNotification(
        t('common.error', 'Erro'),
        t('leads.capture.notifications.error.missingFields', 'Nicho e Localização são obrigatórios.'),
        'error'
      );
      return;
    }

    console.log('[CaptureModal] Nova captura iniciada');

    // Cancel any previous capture request
    if (captureAbortController.current) {
      captureAbortController.current.abort();
      console.log('[CaptureModal] Requisição anterior cancelada');
    }

    // Generate new capture run ID
    const newCaptureRunId = crypto.randomUUID();
    const oldJobId = currentJobId;

    console.log('[CaptureModal] captureRunId:', newCaptureRunId);

    // CRITICAL: Clear all previous results BEFORE creating new job
    console.log('[CaptureModal] Limpando estado anterior (jobId:', oldJobId, ')');

    // Clear previous job results first
    if (oldJobId) {
      clearCaptureResults(oldJobId);
    }

    // Also clear ALL results to ensure no stale data
    clearCaptureResults(); // Clear all

    // Reset all local state FIRST
    setSelectedLeads([]);
    setResultsPage(1);
    setCaptureDebug({ candidatesGenerated: 0, candidatesValidated: 0, totalResults: 0, lastError: null });
    setCurrentCaptureConfig({ ...captureConfig });

    // Create new job with new ID
    const newJobId = startCaptureJob({ ...captureConfig, captureRunId: newCaptureRunId });
    setCaptureRunId(newCaptureRunId);
    setCurrentJobId(newJobId);

    // Now set step to 2 (loading)
    setStep(2);

    console.log('[CaptureModal] Config atual:', captureConfig);
    console.log('[CaptureModal] Job criado:', newJobId);

    captureService.runJob(newJobId, captureConfig, newCaptureRunId);
  };

  // Update debug info when results change
  useEffect(() => {
    if (results.length > 0) {
      setCaptureDebug(prev => ({ ...prev, totalResults: results.length }));
    }
  }, [results.length]);

  useEffect(() => {
    if (currentJob?.status === 'completed' && step === 2) {
      console.log('[CaptureModal] Captura concluída! Resultados:', results.length);
      console.log('[CaptureModal] captureRunId atual:', captureRunId);
      console.log('[CaptureModal] Job captureRunId:', currentJob?.captureRunId);

      // Validate that results match current captureRunId
      if (currentJob?.captureRunId && captureRunId && currentJob.captureRunId !== captureRunId) {
        console.warn('[CaptureModal] Resultado de captura anterior ignorado! Expected:', captureRunId, 'Got:', currentJob.captureRunId);
        console.log('[CaptureModal] Resultado antigo ignorado: true');
        return; // Don't advance to step 3
      }

      console.log('[CaptureModal] Primeiro lead:', results[0]);
      console.log('[CaptureModal] Resultado aplicado: true');

      if (results.length > 0) {
        setTimeout(() => setStep(3), 500);
      }
    }
    if (currentJob?.status === 'failed' && step === 2) {
      console.error('[CaptureModal] Captura falhou:', currentJob?.error);
      setCaptureDebug(prev => ({ ...prev, lastError: currentJob?.error }));
      addNotification(t('common.error'), currentJob?.error || 'A captura falhou. Revise os filtros ou tente novamente.', 'error');
    }
  }, [currentJob?.status, currentJob?.error, currentJob?.captureRunId, step, addNotification, t, results, captureRunId]);

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

      const estimatedValue = lead.estimatedValue || calculateAiDevelopmentEstimatedValue(lead, captureConfig.captureMetric);
      const prospectingPlan = lead.prospectingPlan || buildProspectingPlan(lead, captureConfig.captureMetric);
      const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedValue);
      const importedLead = addLead({
        company: lead.name,
        contact: lead.contact || 'Representante',
        email: lead.email || '',
        phone: lead.phone || '',
        website: lead.website || '',
        source: 'Captura Automática',
        value: estimatedValue,
        notes: `Capturado via automação (${captureConfig.niche} em ${captureConfig.location}). Valor estimado para desenvolvimento com IA: ${formattedValue}. Score: ${lead.score}/100`,
        industry: captureConfig.niche,
        status: prospectingPlan.nextStage,
        score: lead.score,
        stage: prospectingPlan.tier,
        conversionReadiness: prospectingPlan.readiness,
        prospectingPlan,
        conversionSignals: lead.conversionSignals || [],
        interactionHistory: [
          createLeadInteraction('captured', `Lead capturado via ${lead.source || 'automacao'} para ${prospectingPlan.offer.label}.`, {
            captureMetric: captureConfig.captureMetric,
            score: lead.score,
            estimatedValue,
          }),
        ],
        commercialOwnerUserId: user?.id,
        commercialOwnerEmail: user?.email,
        commercialOwnerName: user?.name,
        captureIdentity: claim.identity,
        captureMetric: captureConfig.captureMetric,
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

  // Save leads for future contact
  const [isSavingFuture, setIsSavingFuture] = useState(false);

  const handleSaveForFutureContact = async () => {
    if (selectedLeads.length === 0) {
      addNotification('Nenhum lead selecionado', 'Selecione ao menos um lead para salvar.', 'warning');
      return;
    }

    setIsSavingFuture(true);

    try {
      const leadsToSave = results.filter(r => selectedLeads.includes(r.id));

      const response = await fetch('/api/leads/save-for-future-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: leadsToSave,
          captureMetric: captureConfig.captureMetric,
          niche: captureConfig.niche,
          location: captureConfig.location,
          userId: user?.id,
          userName: user?.name || user?.email,
          tenantId: user?.tenant_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao salvar leads');
      }

      addNotification(
        'Leads salvos com sucesso',
        data.message || `${data.savedCount} leads salvos para contato futuro.`,
        'success'
      );

      // Close modal after successful save
      onClose();

    } catch (error) {
      console.error('[CaptureModal] Erro ao salvar para contato futuro:', error);
      addNotification(
        'Erro ao salvar',
        error.message || 'Não foi possível salvar os leads para contato futuro.',
        'error'
      );
    } finally {
      setIsSavingFuture(false);
    }
  };

  const handleGoBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  // Handle going back to step 1 - fully reset state
  const handleGoToStep1 = () => {
    console.log('[CaptureModal] Voltando para etapa 1 - limpando tudo');

    // Clear all capture results
    clearCaptureResults();

    // Reset all state
    setStep(1);
    setCurrentJobId(null);
    setSelectedLeads([]);
    setResultsPage(1);
    setCaptureRunId(null);
    setCurrentCaptureConfig(null);
    setCaptureDebug({ candidatesGenerated: 0, candidatesValidated: 0, totalResults: 0, lastError: null });
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
    const leadsToImport = await handleImportLeads();

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

        if (!lead.email) {
          throw new Error('No email found');
        }

        await emailService.sendEmail(lead.email, subject, html);
        updateLead(lead.importedLeadId, {
          status: 'qualified',
          emailStatus: 'sent',
          lastEmailSentAt: new Date().toISOString(),
          lastActivity: new Date().toISOString().split('T')[0],
          notes: `E-mail de prospecção enviado em ${new Date().toLocaleDateString('pt-BR')}. Capturado via automação (${captureConfig.niche} em ${captureConfig.location}). Score: ${lead.score}/100`,
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
        {/* Métrica de Captura */}
        <div className="col-span-2 capture-metric-section">
          <label className="input-label">Métrica de captura</label>
          <div className="capture-metric-grid">
            {CAPTURE_METRICS.map(metric => {
              const MetricIcon = METRIC_ICONS[metric.value] || Target;
              const isSelected = captureConfig.captureMetric === metric.value;

              return (
                <button
                  key={metric.value}
                  type="button"
                  className={`capture-metric-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setCaptureConfig({ ...captureConfig, captureMetric: metric.value })}
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

        {/* Nicho / Segmento */}
        <div className="capture-niche-dropdown">
          <CustomDropdown
            label={t('leads.capture.form.niche')}
            value={captureConfig.niche}
            onChange={(val) => {
              console.log('[CaptureModal] Nicho alterado:', val);
              setCaptureConfig({ ...captureConfig, niche: val });
            }}
            options={NICHE_OPTIONS}
            placeholder="Selecione o nicho..."
            searchable={true}
            clearable={true}
            groupBy="category"
            icon={Target}
          />
        </div>

        {/* Localização */}
        <div className="capture-location-dropdown">
          <CustomDropdown
            label={t('leads.capture.form.location')}
            value={captureConfig.location}
            onChange={(val) => {
              console.log('[CaptureModal] Localização alterada:', val);
              setCaptureConfig({ ...captureConfig, location: val });
            }}
            options={LOCATION_OPTIONS}
            placeholder="Selecione a localização..."
            searchable={true}
            clearable={true}
            groupBy="category"
            icon={MapPin}
          />
        </div>

        {/* Quantidade */}
        <div>
          <CustomDropdown
            label={t('leads.capture.form.quantity')}
            value={captureConfig.quantity}
            onChange={(val) => {
              console.log('[CaptureModal] Quantidade alterada:', val);
              setCaptureConfig({ ...captureConfig, quantity: parseInt(val) });
            }}
            options={QUANTITY_OPTIONS.map(opt => ({
              ...opt,
              description: opt.description,
            }))}
            placeholder="Selecione a quantidade..."
            searchable={false}
            clearable={false}
            renderOption={(option) => (
              <div className="custom-dropdown-option-content">
                <div>
                  <div className="custom-dropdown-option-label">{option.label}</div>
                  <div className="custom-dropdown-option-description">{option.description}</div>
                </div>
              </div>
            )}
          />
        </div>

        {/* Requisitos de contato */}
        <div className="flex flex-col gap-2">
          <label className="input-label">{t('leads.capture.form.requirements')}</label>
          <div className="capture-requirements-grid">
            {Object.keys(captureConfig.contactRequirements).map(req => (
              <label
                key={req}
                htmlFor={`req-${req}`}
                className={`capture-requirement-card ${captureConfig.contactRequirements[req] ? 'is-checked' : ''} ${req === 'email' ? 'is-locked' : ''}`}
              >
                <input
                  id={`req-${req}`}
                  type="checkbox"
                  checked={captureConfig.contactRequirements[req]}
                  onChange={e => setCaptureConfig({
                    ...captureConfig,
                    contactRequirements: { ...captureConfig.contactRequirements, [req]: e.target.checked }
                  })}
                  disabled={req === 'email'}
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
          {captureConfig.niche} em {captureConfig.location} · meta de {captureConfig.quantity} leads qualificados
        </p>

        <div className="progress-bar-container h-3 mb-3">
          <div
            className="progress-bar-fill bg-success shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            style={{ width: `${captureProgress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs font-bold text-muted px-1">
          <span className="text-success">{captureProgress}%</span>
          <span>{Math.min(currentJob?.total_found || 0, captureConfig.quantity)} de {captureConfig.quantity} leads</span>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    // Calcular estatísticas
    const stats = currentJob?.stats || {};
    const totalFound = stats.candidatesFound || results.length;
    const totalScanned = stats.candidatesScanned || 0;
    const leadsQualified = stats.leadsQualified || currentJob?.total_valid || 0;
    const avgScore = results.length > 0
      ? Math.round(results.reduce((acc, curr) => acc + (curr.score || 0), 0) / results.length)
      : 0;

    // Se não há resultados, mostrar mensagem especial
    if (results.length === 0) {
      return (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="capture-results-summary">
            <div className="col-span-4">
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-warning" />
                </div>
                <h4 className="text-lg font-bold text-warning mb-2">Nenhum lead encontrado</h4>
                <p className="text-sm text-muted mb-4">
                  {currentJob?.phaseLabel || 'A captura não retornou resultados.'}
                </p>
                {stats.errors?.length > 0 && (
                  <div className="bg-raised rounded-lg p-3 text-left text-xs">
                    <strong className="text-danger">Erro:</strong>
                    <span className="text-muted ml-1">{stats.errors[0]}</span>
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-2">
                  <p className="text-xs text-muted">Sugestões:</p>
                  <ul className="text-xs text-muted list-disc list-inside">
                    <li>Amplie a localização (ex: "Brasil" em vez de cidade específica)</li>
                    <li>Reduza os requisitos mínimos de contato</li>
                    <li>Tente outro nicho</li>
                    <li>Configure APIs de busca (Google Places, SerpAPI, Bing)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} icon={ChevronLeft}>
              Ajustar Filtros
            </Button>
            <Button variant="primary" onClick={handleStartCapture} icon={Zap}>
              Tentar Novamente
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="capture-results-summary">
          <div className="capture-result-card">
            <div className="w-10 h-10 rounded-lg bg-info-dim flex items-center justify-center text-info">
              <Search size={20} />
            </div>
            <div>
              <div className="text-xs text-muted uppercase font-bold tracking-wider">{t('leads.capture.results.totalFound')}</div>
              <div className="text-xl font-extrabold">{totalFound}</div>
            </div>
          </div>
          <div className="capture-result-card">
            <div className="w-10 h-10 rounded-lg bg-success-dim flex items-center justify-center text-success">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-xs text-muted uppercase font-bold tracking-wider">{t('leads.capture.results.validLeads')}</div>
              <div className="text-xl font-extrabold text-success">{leadsQualified}</div>
            </div>
          </div>
          <div className="capture-result-card">
            <div className="w-10 h-10 rounded-lg bg-k-gold-dim flex items-center justify-center text-k-gold-500">
              <Trophy size={20} />
            </div>
            <div>
              <div className="text-xs text-muted uppercase font-bold tracking-wider">{t('leads.capture.results.avgScore')}</div>
              <div className="text-xl font-extrabold text-k-gold-500">{avgScore}/100</div>
            </div>
          </div>
          <div className="capture-result-card">
            <div className="w-10 h-10 rounded-lg bg-k-gold-dim flex items-center justify-center text-k-gold-500">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-xs text-muted uppercase font-bold tracking-wider">Métrica</div>
              <div className="text-sm font-bold text-primary">
                {CAPTURE_METRICS.find(metric => metric.value === captureConfig.captureMetric)?.label}
              </div>
            </div>
          </div>
        </div>

        {/* Mensagem se parcial */}
        {stats.requested > leadsQualified && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm text-muted">
            <strong className="text-warning">Atenção:</strong> Encontramos {leadsQualified} leads válidos de {stats.requested} solicitados.
            Para mais resultados, amplie a localização ou reduza os requisitos mínimos.
          </div>
        )}

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
                    <div className="text-[11px] text-muted flex items-center gap-1">
                      <Globe size={10} />
                      {lead.website ? (
                        <a
                          className="capture-lead-link text-info hover:underline"
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir site"
                        >
                          {lead.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-warning">Sem site</span>
                      )}
                    </div>
                    {lead.snippet && (
                      <div className="text-[9px] text-muted mt-0.5 truncate max-w-[200px]">{lead.snippet.substring(0, 80)}...</div>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="progress-bar-container w-20 h-2 rounded-full overflow-hidden bg-raised">
                          <div
                            className={`h-full ${lead.score > 70 ? 'bg-success' : lead.score > 40 ? 'bg-warning' : 'bg-danger'}`}
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-bold font-mono text-primary">{lead.score}</span>
                      </div>
                      <div className="text-[9px] text-muted">
                        {lead.website ? 'Site funcional' : 'Sem site'}
                        {lead.email && ' | Email'}
                        {lead.phone && ' | Telefone'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1 text-xs">
                      {lead.email && (
                        <div className="flex items-center gap-1 text-muted" title={lead.email}>
                          <Mail size={12} />
                          <span className="truncate max-w-[120px]">{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1 text-muted" title={lead.phone}>
                          <Phone size={12} />
                          <span>{lead.phone}</span>
                        </div>
                      )}
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
              Página {paginatedResults.currentPage} de {paginatedResults.totalPages}
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
  };

  const renderStep4 = () => {
    const previewLead = results.find(l => l.id === selectedLeads[0]) || { name: 'Nome de Teste' };

    return (
      <div className="capture-email-layout animate-fade-in">
        <div className="flex-1 flex flex-col gap-4">
          <h4 className="text-primary font-bold flex items-center gap-2">
            <Edit3 size={18} /> Configure a Mensagem Base
          </h4>
          <Input
            id="email-subject"
            label="Assunto do E-mail"
            value={emailTemplate.subject}
            onChange={e => setEmailTemplate({ ...emailTemplate, subject: e.target.value })}
          />
          <div className="flex flex-col gap-2 flex-1">
            <label className="input-label">Corpo do E-mail</label>
            <textarea
              className="input-field resize-none flex-1 font-mono text-sm"
              value={emailTemplate.body}
              onChange={e => setEmailTemplate({ ...emailTemplate, body: e.target.value })}
            />
            <span className="text-[10px] text-muted">Variáveis: [Nome do lead capturado], [Site capturado], [Problema encontrado]</span>
          </div>
        </div>

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
              <Button variant="secondary" onClick={handleGoToStep1} icon={ChevronLeft}>
                Voltar
              </Button>
            )}

            {step === 3 && (
              <Button variant="secondary" onClick={handleGoToStep1} icon={ChevronLeft}>
                Alterar Filtros
              </Button>
            )}

            {step > 3 && step !== 5 && (
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveForFutureContact}
                  disabled={selectedLeads.length === 0 || isSavingFuture}
                  icon={isSavingFuture ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                >
                  {isSavingFuture ? 'Salvando...' : 'Salvar para contato futuro'}
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePreviewEmail}
                  disabled={selectedLeads.length === 0}
                  icon={Edit3}
                >
                  Revisar E-mails
                </Button>
              </div>
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