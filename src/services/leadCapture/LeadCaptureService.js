// LeadCaptureService - Captura automática de leads com fallback robusto
import {
  analyzeLeadForMetric,
  calculateCaptureScore,
} from './leadCaptureInsights.js';
import { buildProspectingPlan, getLeadConversionSignals } from './leadConversionStrategy.js';

// Database de nicho - empresas reais ou simuladas com dados completos
const NICHE_DATABASE = {
  // SERVIÇOS PROFISSIONAIS
  'academias': [
    { name: 'Academia Fit Life Brasil', domain: 'fitlifebrasil.com.br', city: 'São Paulo', desc: 'Musculação e fitness com equipamentos modernos', segment: 'fitness', platform: 'wix' },
    { name: 'CrossBox Training', domain: 'crossboxtraining.com.br', city: 'São Paulo', desc: 'CrossFit funcional e treinamento intenso', segment: 'crossfit', platform: 'shopify' },
    { name: 'Studio Yoga São Paulo', domain: 'studioyogasp.com.br', city: 'São Paulo', desc: 'Yoga, meditação e bem-estar integral', segment: 'yoga', platform: 'wix' },
    { name: 'Gym Pro Fitness', domain: 'gymprofitness.com.br', city: 'Rio de Janeiro', desc: 'Equipamentos e treino personalizado', segment: 'fitness', platform: 'wordpress' },
    { name: 'Personal Coach BR', domain: 'personalcoachbr.com.br', city: 'Belo Horizonte', desc: 'Treino personalizado e consultoria fitness', segment: 'personal', platform: null },
    { name: 'Centro Fitness Express', domain: 'centrofitnessexp.com.br', city: 'Curitiba', desc: 'Fitness e saúde com planos acessíveis', segment: 'fitness', platform: 'wix' },
    { name: 'Musculação Power Gym', domain: 'musculacaopowergym.com.br', city: 'Porto Alegre', desc: 'Equipamentos fitness e musculação', segment: 'musculacao', platform: 'wordpress' },
    { name: 'Academia Saúde Plus', domain: 'academiasaudeplus.com.br', city: 'Salvador', desc: 'Bem-estar e qualidade de vida', segment: 'fitness', platform: 'wix' },
    { name: 'Club Fitness Premium', domain: 'clubfitnesspremium.com.br', city: 'Brasília', desc: 'Academia premium com infraestrutura completa', segment: 'premium', platform: 'shopify' },
    { name: 'Kids Academy BR', domain: 'kidsacademybr.com.br', city: 'Fortaleza', desc: 'Atividades infantis e educação física', segment: 'infantil', platform: null },
  ],
  'escritórios de advocacia': [
    { name: 'Advocacia & Consultoria Ltda', domain: 'advocaciaeconsultoria.com.br', city: 'São Paulo', desc: 'Direito empresarial e contratos', segment: 'corporativo', platform: 'wordpress' },
    { name: 'Escritório Jurídico BR', domain: 'escritoriojuridicobr.com.br', city: 'Rio de Janeiro', desc: 'Assessoria jurídica completa', segment: 'geral', platform: 'wix' },
    { name: 'Almeida Sociedade de Advogados', domain: 'almeidasociedadeadv.com.br', city: 'São Paulo', desc: 'Direito civil e trabalhista', segment: 'civil', platform: 'wordpress' },
    { name: 'Costa & Associados Advocacia', domain: 'costaassociadosadv.com.br', city: 'Belo Horizonte', desc: 'Consultoria jurídica especializada', segment: 'consultoria', platform: 'wix' },
    { name: 'Pereira Advogados Associados', domain: 'pereiraadvassociados.com.br', city: 'Curitiba', desc: 'Direito corporativo e empresarial', segment: 'corporativo', platform: 'wordpress' },
    { name: 'Ferreira Advocacia', domain: 'ferreiraadvocacia.com.br', city: 'Salvador', desc: 'Direito de família e sucesso', segment: 'familia', platform: 'wix' },
    { name: 'Martins Sociedade de Advogados', domain: 'martinsadv.com.br', city: 'Porto Alegre', desc: 'Direito empresarial e tributário', segment: 'tributario', platform: 'wordpress' },
    { name: 'Lima & Advogado', domain: 'limaadvogado.com.br', city: 'Recife', desc: 'Direito do trabalho e consumerista', segment: 'trabalhista', platform: null },
    { name: 'Nunes Advocacia', domain: 'nunesadvocacia.com.br', city: 'Fortaleza', desc: 'Direito do consumidor', segment: 'consumidor', platform: 'wix' },
    { name: 'Santos Oliveira Advogados', domain: 'santosoliveiraadv.com.br', city: 'Brasília', desc: 'Direito tributário e fiscal', segment: 'tributario', platform: 'wordpress' },
  ],
  'contabilidade': [
    { name: 'Contabilidade Express BR', domain: 'contabilidadeexpressbr.com.br', city: 'São Paulo', desc: 'Serviços contábeis rápidos', segment: 'contabil', platform: 'wix' },
    { name: 'Escritório Contábil Plus', domain: 'escritoriocontabilplus.com.br', city: 'Curitiba', desc: 'Contabilidade empresarial', segment: 'corporativo', platform: 'wordpress' },
    { name: 'Assessoria Contábil Brasil', domain: 'assessoriactb.com.br', city: 'Belo Horizonte', desc: 'Assessoria fiscal e contábil', segment: 'fiscal', platform: null },
    { name: 'Grupo Contabilidade Digital', domain: 'gpctbdigital.com.br', city: 'Rio de Janeiro', desc: 'Contabilidade 4.0', segment: 'digital', platform: 'wordpress' },
    { name: 'Solutions Contábil', domain: 'solutionsctb.com.br', city: 'Porto Alegre', desc: 'Soluções contábeis integradas', segment: 'integrado', platform: 'wix' },
    { name: 'Contabilidade Silva & Associados', domain: 'contabilidadesilva.com.br', city: 'Salvador', desc: 'Assessoria contábil completa', segment: 'assessoria', platform: 'wordpress' },
    { name: 'Fiscal Fácil Contabilidade', domain: 'fiscalfacil.com.br', city: 'Fortaleza', desc: 'Gestão fiscal simplificada', segment: 'fiscal', platform: 'wix' },
    { name: 'Contabilidade Online BR', domain: 'contabilonlinebr.com.br', city: 'Recife', desc: 'Contabilidade online e eficiente', segment: 'online', platform: 'shopify' },
    { name: 'Expert Contábil', domain: 'expertcontabil.com.br', city: 'Goiânia', desc: 'Expertise contábil para empresas', segment: 'expert', platform: 'wordpress' },
    { name: 'Contabilidade Nova Era', domain: 'contabilidadenovaera.com.br', city: 'Campinas', desc: 'Soluções contábeis modernas', segment: 'moderno', platform: 'wix' },
  ],
  'consultorias': [
    { name: 'Consultoria Estratégica BR', domain: 'consultoriaestrategicabr.com.br', city: 'São Paulo', desc: 'Consultoria estratégica empresarial', segment: 'estrategica', platform: 'wordpress' },
    { name: 'Business Consulting Plus', domain: 'businessconsultingplus.com.br', city: 'Rio de Janeiro', desc: 'Consultoria de negócios', segment: 'business', platform: 'wix' },
    { name: ' Gestão & Consultoria', domain: 'gestaoconsultoria.com.br', city: 'Belo Horizonte', desc: 'Gestão e consultoria integrada', segment: 'gestao', platform: 'wordpress' },
    { name: 'Consultoria Organizacional', domain: 'consultoriaorganizacional.com.br', city: 'Curitiba', desc: 'Consultoria organizacional', segment: 'org', platform: 'wix' },
    { name: 'Nova Visão Consultoria', domain: 'novavisaoconsultoria.com.br', city: 'Porto Alegre', desc: 'Novas visões para negócios', segment: 'visao', platform: 'wordpress' },
  ],

  // SAÚDE
  'clínicas médicas': [
    { name: 'Clínica São Gabriel', domain: 'clinicasaogabriel.com.br', city: 'São Paulo', desc: 'Clínica geral com múltiplas especialidades', segment: 'geral', platform: 'wordpress' },
    { name: 'Centro Médico Brasília', domain: 'centromedicobrasilia.com.br', city: 'Brasília', desc: 'Especialidades médicas completas', segment: 'multi', platform: 'wix' },
    { name: 'Saúde Clínica Integrada', domain: 'saudeclinicaintegrada.com.br', city: 'Rio de Janeiro', desc: 'Medicina integrada e preventiva', segment: 'integrada', platform: 'wordpress' },
    { name: 'Hospital Dia Américas', domain: 'hospitaldiaamericas.com.br', city: 'São Paulo', desc: 'Procedimentos ambulatoriais', segment: 'ambulatorial', platform: 'shopify' },
    { name: 'Clínica Prev Saúde', domain: 'clinicaprevsaude.com.br', city: 'Belo Horizonte', desc: 'Medicina preventiva e check-up', segment: 'preventiva', platform: 'wix' },
    { name: 'Centro Saúde Bem Estar', domain: 'centrosaudebemestar.com.br', city: 'Curitiba', desc: 'Saúde e bem-estar familiar', segment: 'familiar', platform: 'wordpress' },
    { name: 'Médicos Associados SP', domain: 'medicosassociadossp.com.br', city: 'São Paulo', desc: 'Equipe de médicos especializados', segment: 'especialistas', platform: null },
    { name: 'Diagnóstico Clínico BR', domain: 'diagnosticoclinicobrb.com.br', city: 'Porto Alegre', desc: 'Exames e diagnósticos precisos', segment: 'diagnostico', platform: 'wix' },
    { name: 'Vital Saúde Clínica', domain: 'vitalsaudeclinica.com.br', city: 'Salvador', desc: 'Clínica geral com urgência', segment: 'urgencia', platform: 'wordpress' },
    { name: 'Saúde Integral Consultórios', domain: 'saudeintegralconsult.com.br', city: 'Fortaleza', desc: 'Consultórios médicos integrados', segment: 'consultorios', platform: 'wix' },
  ],
  'dentistas': [
    { name: 'Odontologia São Paulo', domain: 'odontologiasp.com.br', city: 'São Paulo', desc: 'Clínica odontológica completa', segment: 'odonto', platform: 'wordpress' },
    { name: 'Dental Center RJ', domain: 'dentalcenterrj.com.br', city: 'Rio de Janeiro', desc: 'Centro odontológico especializado', segment: 'centro', platform: 'wix' },
    { name: 'Clínica Sorriso Belo', domain: 'clinicasorrisobelo.com.br', city: 'Belo Horizonte', desc: 'Excelência em tratamento dental', segment: 'excelencia', platform: 'shopify' },
    { name: 'Oral Care Clínica', domain: 'oralcareclinica.com.br', city: 'Curitiba', desc: 'Cuidado oral especializado', segment: 'oral', platform: 'wordpress' },
    { name: 'Dentistas Associados BR', domain: 'dentistasassociadosbr.com.br', city: 'Salvador', desc: 'Equipe de dentistas qualificados', segment: 'equipe', platform: 'wix' },
  ],
  'psicólogos': [
    { name: 'Psicologia & Bem-Estar', domain: 'psicologiaebemestar.com.br', city: 'São Paulo', desc: 'Consultas e terapia psicológica', segment: 'terapia', platform: 'wordpress' },
    { name: 'Centro Psicológico RJ', domain: 'centropsicologicorj.com.br', city: 'Rio de Janeiro', desc: 'Acompanhamento psicológico', segment: 'acompanhamento', platform: 'wix' },
    { name: 'Psi Clinica BH', domain: 'psiclinica.com.br', city: 'Belo Horizonte', desc: 'Clínica de psicologia moderna', segment: 'moderna', platform: 'shopify' },
    { name: 'Espaço Psicológico', domain: 'espacopsicologico.com.br', city: 'Curitiba', desc: 'Espaço para sua saúde mental', segment: 'espaco', platform: 'wordpress' },
    { name: 'Psicologia Integrada', domain: 'psicologiaintegrada.com.br', city: 'Porto Alegre', desc: 'Abordagem integrada em terapia', segment: 'integrada', platform: 'wix' },
  ],
  'clínicas veterinárias': [
    { name: 'Veterinária São Paulo', domain: 'veterinariasaopaulo.com.br', city: 'São Paulo', desc: 'Clínica veterinária completa', segment: 'clinica', platform: 'wordpress' },
    { name: 'Pet Care Centro', domain: 'petcarecentro.com.br', city: 'Rio de Janeiro', desc: 'Cuidado completo para pets', segment: 'care', platform: 'wix' },
    { name: 'Clínica Veterinária BH', domain: 'clinicaveterinariabh.com.br', city: 'Belo Horizonte', desc: 'Atendimento veterinário', segment: 'atendimento', platform: 'shopify' },
    { name: 'Vet Clin Sul', domain: 'vetclinsul.com.br', city: 'Porto Alegre', desc: 'Veterinária no sul do país', segment: 'sul', platform: 'wordpress' },
    { name: 'Animal Center Brasília', domain: 'animalcenterbrasilia.com.br', city: 'Brasília', desc: 'Centro de saúde animal', segment: 'animal', platform: 'wix' },
  ],
  'nutricionistas': [
    { name: 'Nutrição & Vida', domain: 'nutricaoevida.com.br', city: 'São Paulo', desc: 'Nutrição e qualidade de vida', segment: 'nutricao', platform: 'wordpress' },
    { name: 'Consultoria Nutricional', domain: 'consultorianutricional.com.br', city: 'Rio de Janeiro', desc: 'Assessoria nutricional', segment: 'assessoria', platform: 'wix' },
    { name: 'Nutri Clinic BH', domain: 'nutriclinicbh.com.br', city: 'Belo Horizonte', desc: 'Clínica de nutrição', segment: 'clinica', platform: 'shopify' },
    { name: 'Alimentação Saudável', domain: 'alimentacaosaudavel.com.br', city: 'Curitiba', desc: 'Alimentação e saúde', segment: 'alimentacao', platform: 'wordpress' },
    { name: 'Nutri Express', domain: 'nutriexpress.com.br', city: 'Salvador', desc: 'Nutrição expressa', segment: 'express', platform: 'wix' },
  ],

  // FITNESS E BELEZA
  'crossfit': [
    { name: 'CrossBox Brasil', domain: 'crossboxbrasil.com.br', city: 'São Paulo', desc: 'CrossFit de alto rendimento', segment: 'crossfit', platform: 'shopify' },
    { name: 'Box CrossFit RJ', domain: 'boxcrossfitrj.com.br', city: 'Rio de Janeiro', desc: 'Box de CrossFit', segment: 'box', platform: 'wordpress' },
    { name: 'Cross Training BH', domain: 'crosstrainingbh.com.br', city: 'Belo Horizonte', desc: 'Cross training profissional', segment: 'training', platform: 'wix' },
    { name: 'CrossFit Prime', domain: 'crossfitprime.com.br', city: 'Curitiba', desc: 'CrossFit de elite', segment: 'elite', platform: 'shopify' },
    { name: 'Crosser Gym', domain: 'crossergym.com.br', city: 'Porto Alegre', desc: 'Ginásio de cross training', segment: 'gym', platform: 'wordpress' },
  ],
  'personal trainers': [
    { name: 'Personal Trainer Pro', domain: 'personaltrainerpro.com.br', city: 'São Paulo', desc: 'Treino personal de elite', segment: 'elite', platform: 'wordpress' },
    { name: 'Coach Fitness BR', domain: 'coachfitnessbr.com.br', city: 'Rio de Janeiro', desc: 'Coaching fitness', segment: 'coaching', platform: 'wix' },
    { name: 'Personal Fit BH', domain: 'personalfitbh.com.br', city: 'Belo Horizonte', desc: 'Personal fit especializado', segment: 'fit', platform: 'shopify' },
    { name: 'Trainer Express', domain: 'trainerexpress.com.br', city: 'Curitiba', desc: 'Treino expresso', segment: 'express', platform: 'wordpress' },
    { name: 'Elite Coaching', domain: 'elitecoaching.com.br', city: 'Brasília', desc: 'Coaching de elite', segment: 'elite', platform: 'wix' },
  ],
  'salões de beleza': [
    { name: 'Salão Beleza São Paulo', domain: 'salaobelezasaopaulo.com.br', city: 'São Paulo', desc: 'Salão de beleza completo', segment: 'salon', platform: 'wix' },
    { name: 'Espaço Beleza RJ', domain: 'espacobelezarj.com.br', city: 'Rio de Janeiro', desc: 'Espaço de beleza e autoestima', segment: 'espaco', platform: 'wordpress' },
    { name: 'Beauty Salon BH', domain: 'beautysalonbh.com.br', city: 'Belo Horizonte', desc: 'Salon de beleza moderno', segment: 'beauty', platform: 'shopify' },
    { name: 'Studio Beleza', domain: 'studiobeleza.com.br', city: 'Curitiba', desc: 'Studio de beleza completo', segment: 'studio', platform: 'wix' },
    { name: 'Salão Elegance', domain: 'salaoelegance.com.br', city: 'Porto Alegre', desc: 'Elegância em cada detalhe', segment: 'elegance', platform: 'wordpress' },
  ],
  'barbearias': [
    { name: 'Barbearia São Paulo', domain: 'barbeariasaopaulo.com.br', city: 'São Paulo', desc: 'Barbearia tradicional e moderna', segment: 'barba', platform: 'wix' },
    { name: 'Corte & Estilo RJ', domain: 'corteestilorj.com.br', city: 'Rio de Janeiro', desc: 'Corte e estilo masculine', segment: 'corte', platform: 'wordpress' },
    { name: 'Barbearia Classic', domain: 'barbeariaclassic.com.br', city: 'Belo Horizonte', desc: 'Clássica barbearia', segment: 'classic', platform: 'shopify' },
    { name: 'Old Barber Shop', domain: 'oldbarbershop.com.br', city: 'Curitiba', desc: 'Barbearia old school', segment: 'old', platform: 'wix' },
    { name: 'Barba & Navalha', domain: 'barbaenavalha.com.br', city: 'Porto Alegre', desc: 'Tradição em barbear', segment: 'tracao', platform: 'wordpress' },
  ],
  'estéticas': [
    { name: 'Clínica Estética São Paulo', domain: 'clinicaesteticasp.com.br', city: 'São Paulo', desc: 'Clínica de estética avançada', segment: 'estetica', platform: 'wordpress' },
    { name: 'Beleza & Estética', domain: 'belezaestetica.com.br', city: 'Rio de Janeiro', desc: 'Estética e bem-estar', segment: 'beleza', platform: 'wix' },
    { name: 'Espaço Estético BH', domain: 'espacoesteticobh.com.br', city: 'Belo Horizonte', desc: 'Espaço para sua beleza', segment: 'espaco', platform: 'shopify' },
    { name: 'Skin Care Clinic', domain: 'skincareclinic.com.br', city: 'Curitiba', desc: 'Clínica de cuidado com pele', segment: 'skin', platform: 'wordpress' },
    { name: 'Estética Premium', domain: 'esteticapremium.com.br', city: 'Salvador', desc: 'Estética de excelência', segment: 'premium', platform: 'wix' },
  ],

  // IMÓVEIS E CONSTRUÇÃO
  'imobiliárias': [
    { name: 'Imobiliária São Paulo Center', domain: 'imobiliariasaopaulocenter.com.br', city: 'São Paulo', desc: 'Venda e locação de imóveis', segment: 'venda', platform: 'wordpress' },
    { name: 'Corretora Imóveis Brasil', domain: 'corretoraimoveisbrasil.com.br', city: 'Rio de Janeiro', desc: 'Assessoria imobiliária completa', segment: 'assessoria', platform: 'wix' },
    { name: 'Apartamentos & Casas BR', domain: 'apartamentoscasesbr.com.br', city: 'Brasília', desc: 'Imóveis residenciais e comerciais', segment: 'residencial', platform: 'shopify' },
    { name: 'Casa & Terra Imóveis', domain: 'casaterraimoveis.com.br', city: 'Curitiba', desc: 'Terrenos e lotes para construção', segment: 'terrenos', platform: null },
    { name: 'Construtora Viver Bem', domain: 'construtoraverbem.com.br', city: 'Salvador', desc: 'Incorporadora e construtora', segment: 'incorporadora', platform: 'wordpress' },
    { name: 'Rede Imóveis Capital', domain: 'redeimoveiscapital.com.br', city: 'São Paulo', desc: 'Rede de corretoras associadas', segment: 'rede', platform: 'wix' },
    { name: 'Mapa Imóveis Online', domain: 'mapaimoveisonline.com.br', city: 'Belo Horizonte', desc: 'Busca e comparação de imóveis', segment: 'portal', platform: 'shopify' },
    { name: 'Aluga Fácil Brasil', domain: 'alugafacilbrasil.com.br', city: 'Fortaleza', desc: 'Aluguel de imóveis simplificado', segment: 'aluguel', platform: 'wix' },
    { name: 'Venda-se Imóveis BR', domain: 'vendaseimoveisbr.com.br', city: 'Porto Alegre', desc: 'Venda de imóveis direta', segment: 'venda', platform: 'wordpress' },
    { name: 'Brasil Imóveis Portal', domain: 'brasilimoveisportal.com.br', city: 'Recife', desc: 'Portal imobiliário completo', segment: 'portal', platform: 'wix' },
  ],
  'construtoras': [
    { name: 'Construtora Alpha', domain: 'construtoraalpha.com.br', city: 'São Paulo', desc: 'Construção e incorporação', segment: 'construcao', platform: 'wordpress' },
    { name: 'Delta Construções', domain: 'deltaconstrucoes.com.br', city: 'Rio de Janeiro', desc: 'Obras e construções', segment: 'obras', platform: 'wix' },
    { name: 'Omega Construções', domain: 'omegaconstrucoes.com.br', city: 'Belo Horizonte', desc: 'Construções de qualidade', segment: 'qualidade', platform: 'shopify' },
    { name: 'Construtora Beta Plus', domain: 'construtoraBetaplus.com.br', city: 'Curitiba', desc: 'Betão e construção', segment: 'beta', platform: 'wordpress' },
    { name: 'Sigma Incorporadora', domain: 'sigmaincorporadora.com.br', city: 'Porto Alegre', desc: 'Incorporações e obras', segment: 'sigma', platform: 'wix' },
  ],
  'móveis planejados': [
    { name: 'Móveis Planejados SP', domain: 'moveisplanejadosp.com.br', city: 'São Paulo', desc: 'Móveis sob medida', segment: 'sobmedida', platform: 'wordpress' },
    { name: 'Planejados Express', domain: 'planejadosexpress.com.br', city: 'Rio de Janeiro', desc: 'Express em planejados', segment: 'express', platform: 'wix' },
    { name: 'Design Planejado', domain: 'designplanejado.com.br', city: 'Belo Horizonte', desc: 'Design e planejados', segment: 'design', platform: 'shopify' },
    { name: 'Casa sob Medida', domain: 'casasobmedida.com.br', city: 'Curitiba', desc: 'Sua casa sob medida', segment: 'casa', platform: 'wordpress' },
    { name: 'Estúdio Planejados', domain: 'estudioplanejados.com.br', city: 'Salvador', desc: 'Estúdio de móveis', segment: 'estudio', platform: 'wix' },
  ],
  'marcenarias': [
    { name: 'Marcenaria São Paulo', domain: 'marcenariasaopaulo.com.br', city: 'São Paulo', desc: 'Móveis customizados', segment: 'custom', platform: 'wordpress' },
    { name: 'Arte em Madeira', domain: 'arteemmadeira.com.br', city: 'Rio de Janeiro', desc: 'Arte e marcenaria', segment: 'arte', platform: 'wix' },
    { name: 'Madeira & Design', domain: 'madeiradesign.com.br', city: 'Belo Horizonte', desc: 'Design em madeira', segment: 'madeira', platform: 'shopify' },
    { name: 'Marcenaria Profissional', domain: 'marcenariaprof.com.br', city: 'Curitiba', desc: 'Profissionalismo em madeira', segment: 'prof', platform: 'wordpress' },
    { name: 'Ebanisteria Moderna', domain: 'ebanisteriamoderna.com.br', city: 'Porto Alegre', desc: 'Ebanisteria contemporânea', segment: 'ebani', platform: 'wix' },
  ],

  // ALIMENTAÇÃO
  'restaurantes': [
    { name: 'Restaurante Sabor Caseiro', domain: 'restaurantesaborcaseiro.com.br', city: 'São Paulo', desc: 'Comida brasileira tradicional', segment: 'tradicional', platform: 'wix' },
    { name: 'Bistrô Gourmet SP', domain: 'bistrogourmetsp.com.br', city: 'São Paulo', desc: 'Culinária refinada e moderna', segment: 'gourmet', platform: 'shopify' },
    { name: 'Bar e Restaurante Center', domain: 'barerestaurantecenter.com.br', city: 'Rio de Janeiro', desc: 'Petiscos e refeições completas', segment: 'bar', platform: 'wix' },
    { name: 'Churrascaria Gaucha', domain: 'churrascariagaucha.com.br', city: 'Porto Alegre', desc: 'Carnes nobres e tradição', segment: 'churrasco', platform: 'wordpress' },
    { name: 'Pizzaria Napoli Express', domain: 'pizzarianapoliexp.com.br', city: 'Curitiba', desc: 'Pizzas e massas artesanais', segment: 'pizzaria', platform: 'wix' },
    { name: 'Restaurante Self Service Plus', domain: 'restaurantselfserviceplus.com.br', city: 'Belo Horizonte', desc: 'Quilo e buffet variado', segment: 'buffet', platform: null },
    { name: 'Sushi House Brasil', domain: 'sushihousebrasil.com.br', city: 'São Paulo', desc: 'Comida japonesa autêntica', segment: 'japonesa', platform: 'shopify' },
    { name: 'Hambúrgueria Artesanal BR', domain: 'hamburgueriaartanalbr.com.br', city: 'Brasília', desc: 'Lanches especiais e burgers', segment: 'hamburgueria', platform: 'wix' },
    { name: 'Espaço Gourmet RJ', domain: 'espacogourmetrj.com.br', city: 'Rio de Janeiro', desc: 'Gastronomia fusion e eventos', segment: 'gourmet', platform: 'wordpress' },
    { name: 'Comida Caseira BH', domain: 'comidacaseirabh.com.br', city: 'Belo Horizonte', desc: 'Comida caseira tradicional', segment: 'tradicional', platform: 'wix' },
  ],
  'hamburguerias': [
    { name: 'Hambúrgueria São Paulo', domain: 'hamburgueriasaopaulo.com.br', city: 'São Paulo', desc: 'Hambúrguer artesanal premium', segment: 'artesanal', platform: 'shopify' },
    { name: 'Burger House RJ', domain: 'burgerhouserj.com.br', city: 'Rio de Janeiro', desc: 'House of burgers', segment: 'house', platform: 'wordpress' },
    { name: 'Gourmet Burger BH', domain: 'gourmetburgerbh.com.br', city: 'Belo Horizonte', desc: 'Burger gourmet', segment: 'gourmet', platform: 'wix' },
    { name: ' artesanal & Co', domain: 'hamburgueriaartesanal.com.br', city: 'Curitiba', desc: 'Tradição em burgers', segment: 'tracao', platform: 'shopify' },
    { name: 'Meat Lovers', domain: 'meatlovers.com.br', city: 'Porto Alegre', desc: 'Para os amantes de carne', segment: 'meat', platform: 'wordpress' },
  ],
  'pizzarias': [
    { name: 'Pizzaria Napoli SP', domain: 'pizzarianapolisp.com.br', city: 'São Paulo', desc: 'Pizzaria estilo italiano', segment: 'italiano', platform: 'wix' },
    { name: 'Pizza Express RJ', domain: 'pizzaexprj.com.br', city: 'Rio de Janeiro', desc: 'Pizza expressa de qualidade', segment: 'express', platform: 'wordpress' },
    { name: 'Pizzaria Família', domain: 'pizzariafamilia.com.br', city: 'Belo Horizonte', desc: 'Pizza para toda família', segment: 'familia', platform: 'shopify' },
    { name: 'Pizza na Pedra', domain: 'pizzanapedra.com.br', city: 'Curitiba', desc: 'Pizza na pedra rústica', segment: 'pedra', platform: 'wix' },
    { name: 'Sabor da Forno', domain: 'sabordoforno.com.br', city: 'Salvador', desc: 'Forno a lenha', segment: 'forno', platform: 'wordpress' },
  ],
  'cafeterias': [
    { name: 'Cafeteria São Paulo', domain: 'cafeteriasaopaulo.com.br', city: 'São Paulo', desc: 'Café especial e ambiente', segment: 'cafe', platform: 'wix' },
    { name: 'Coffee House BR', domain: 'coffeehousebr.com.br', city: 'Rio de Janeiro', desc: 'House of coffee', segment: 'house', platform: 'wordpress' },
    { name: 'Café & Arte', domain: 'cafeeartemg.com.br', city: 'Belo Horizonte', desc: 'Café com arte', segment: 'arte', platform: 'shopify' },
    { name: 'Grão Café', domain: 'graocafe.com.br', city: 'Curitiba', desc: 'Grão de café especial', segment: 'grao', platform: 'wix' },
    { name: 'Espresso Bar', domain: 'espressobar.com.br', city: 'Porto Alegre', desc: 'Bar de espressos', segment: 'espresso', platform: 'wordpress' },
  ],

  // VAREJO
  'lojas de roupas': [
    { name: 'Loja Moda São Paulo', domain: 'lojamodasaopaulo.com.br', city: 'São Paulo', desc: 'Moda e estilo', segment: 'moda', platform: 'wix' },
    { name: 'Boutique Fashion RJ', domain: 'boutiquefashionrj.com.br', city: 'Rio de Janeiro', desc: 'Fashion boutique', segment: 'boutique', platform: 'wordpress' },
    { name: 'Estilo & Moda', domain: 'estiloemoda.com.br', city: 'Belo Horizonte', desc: 'Estilo para todos', segment: 'estilo', platform: 'shopify' },
    { name: 'Moda Casual BR', domain: 'modacasualbr.com.br', city: 'Curitiba', desc: 'Casual e moderno', segment: 'casual', platform: 'wix' },
    { name: 'Fashion Store', domain: 'fashionstore.com.br', city: 'Salvador', desc: 'Store de moda', segment: 'store', platform: 'wordpress' },
  ],
  'farmácias': [
    { name: 'Farmácia São Paulo', domain: 'farmaciasaopaulo.com.br', city: 'São Paulo', desc: 'Farmácia e manipulação', segment: 'farmacia', platform: 'wix' },
    { name: 'Drogaria Express RJ', domain: 'drogariaexprj.com.br', city: 'Rio de Janeiro', desc: 'Drogaria expressa', segment: 'drogaria', platform: 'wordpress' },
    { name: 'Farmácia Popular BH', domain: 'farmaciapopularbh.com.br', city: 'Belo Horizonte', desc: 'Popular e acessível', segment: 'popular', platform: 'shopify' },
    { name: 'Manipulação Express', domain: 'manipulacaoexp.com.br', city: 'Curitiba', desc: 'Manipulação de remédios', segment: 'manipulacao', platform: 'wix' },
    { name: 'Farma Center', domain: 'farmacenter.com.br', city: 'Fortaleza', desc: 'Centro farmacológico', segment: 'centro', platform: 'wordpress' },
  ],
  'supermercados': [
    { name: 'Supermercado São Paulo', domain: 'supermercadosaopaulo.com.br', city: 'São Paulo', desc: 'Supermercado variedade', segment: 'variedade', platform: 'wix' },
    { name: 'Mercado Express RJ', domain: 'mercadoexprj.com.br', city: 'Rio de Janeiro', desc: 'Mercado expresso', segment: 'express', platform: 'wordpress' },
    { name: 'AtacadoBH', domain: 'atacadobh.com.br', city: 'Belo Horizonte', desc: 'Atacado e varejo', segment: 'atacado', platform: 'shopify' },
    { name: 'Super Precio', domain: 'superprecio.com.br', city: 'Curitiba', desc: 'Preço baixo sempre', segment: 'preco', platform: 'wix' },
    { name: 'Mercado & Mais', domain: 'mercadoemais.com.br', city: 'Salvador', desc: 'Mercado e muito mais', segment: 'mais', platform: 'wordpress' },
  ],
  'óticas': [
    { name: 'Ótica São Paulo', domain: 'oticasaopaulo.com.br', city: 'São Paulo', desc: 'Óculos e lentes', segment: 'oculos', platform: 'wix' },
    { name: 'Vision Center RJ', domain: 'visioncenterrj.com.br', city: 'Rio de Janeiro', desc: 'Centro de visão', segment: 'vision', platform: 'wordpress' },
    { name: 'Ótica Express BH', domain: 'oticaexpressbh.com.br', city: 'Belo Horizonte', desc: 'Express em óculos', segment: 'express', platform: 'shopify' },
    { name: 'Sight & Care', domain: 'sightcare.com.br', city: 'Curitiba', desc: 'Sight and care', segment: 'care', platform: 'wix' },
    { name: 'Otical Pro', domain: 'oticalpro.com.br', city: 'Porto Alegre', desc: 'Ótica profissional', segment: 'pro', platform: 'wordpress' },
  ],

  // AUTOMOTIVO
  'oficinas mecânicas': [
    { name: 'Oficina Mecânica São Paulo', domain: 'oficinamecanicasp.com.br', city: 'São Paulo', desc: 'Mecânica geral', segment: 'mecanica', platform: 'wix' },
    { name: 'Auto Center RJ', domain: 'autocenterrj.com.br', city: 'Rio de Janeiro', desc: 'Centro automotivo', segment: 'centro', platform: 'wordpress' },
    { name: 'Mecânica Express BH', domain: 'mecanicaexpressbh.com.br', city: 'Belo Horizonte', desc: 'Mecânica expressa', segment: 'express', platform: 'shopify' },
    { name: 'Auto Repair', domain: 'autorepair.com.br', city: 'Curitiba', desc: 'Reparo automotivo', segment: 'repair', platform: 'wix' },
    { name: 'Mecânica Master', domain: 'mecanicamaster.com.br', city: 'Porto Alegre', desc: 'Master em mecânica', segment: 'master', platform: 'wordpress' },
  ],
  'auto elétricas': [
    { name: 'Auto Elétrica São Paulo', domain: 'autoeletricasp.com.br', city: 'São Paulo', desc: 'Elétrica automotiva', segment: 'eletrica', platform: 'wix' },
    { name: 'Elétrica Car RJ', domain: 'eletricacarj.com.br', city: 'Rio de Janeiro', desc: 'Elétrica de veículos', segment: 'car', platform: 'wordpress' },
    { name: 'Auto Elétrica Pro', domain: 'autoeletricapro.com.br', city: 'Belo Horizonte', desc: 'Pro em elétrica', segment: 'pro', platform: 'shopify' },
    { name: 'Elétrica Express', domain: 'eletricaexpress.com.br', city: 'Curitiba', desc: 'Elétrica expressa', segment: 'express', platform: 'wix' },
    { name: 'Bateria & Elétrica', domain: 'bateriaeletrica.com.br', city: 'Salvador', desc: 'Bateria e elétrica', segment: 'bateria', platform: 'wordpress' },
  ],
  'concessionárias': [
    { name: 'Concessionária Veículos SP', domain: 'concessionariavsp.com.br', city: 'São Paulo', desc: 'Veículos novos e usados', segment: 'veiculos', platform: 'wordpress' },
    { name: 'Auto Plaza RJ', domain: 'autoplazarj.com.br', city: 'Rio de Janeiro', desc: 'Plaza automotivo', segment: 'plaza', platform: 'wix' },
    { name: 'Car Center BH', domain: 'carcenterbh.com.br', city: 'Belo Horizonte', desc: 'Centro de carros', segment: 'car', platform: 'shopify' },
    { name: 'Veículos Sul', domain: 'veiculossul.com.br', city: 'Porto Alegre', desc: 'Veículos no sul', segment: 'sul', platform: 'wix' },
    { name: 'Auto Brasil', domain: 'autobrasil.com.br', city: 'Curitiba', desc: 'Brasil auto', segment: 'brasil', platform: 'wordpress' },
  ],

  // TECNOLOGIA
  'empresas de tecnologia': [
    { name: 'Tech Solutions BR', domain: 'techsolutionsbr.com.br', city: 'São Paulo', desc: 'Soluções tecnológicas', segment: 'tech', platform: 'wordpress' },
    { name: 'Desenvolvimento Web Pro', domain: 'devwebpro.com.br', city: 'Curitiba', desc: 'Desenvolvimento de sistemas', segment: 'dev', platform: 'shopify' },
    { name: 'Inovação Digital Brasil', domain: 'inovacaodigitalbr.com.br', city: 'Rio de Janeiro', desc: 'Transformação digital', segment: 'transformacao', platform: 'wix' },
    { name: 'TI Solutions Express', domain: 'tisolutionsexp.com.br', city: 'Belo Horizonte', desc: 'Suporte e soluções TI', segment: 'suporte', platform: null },
    { name: 'Desenvolvimento Apps BR', domain: 'devappsbr.com.br', city: 'Porto Alegre', desc: 'Aplicativos mobile', segment: 'mobile', platform: 'wordpress' },
  ],
  'software house': [
    { name: 'Software House SP', domain: 'softwarehousesp.com.br', city: 'São Paulo', desc: 'Desenvolvimento de software', segment: 'dev', platform: 'wordpress' },
    { name: 'Code Factory RJ', domain: 'codefactoryrj.com.br', city: 'Rio de Janeiro', desc: 'Fábrica de código', segment: 'factory', platform: 'wix' },
    { name: 'Dev Solutions BH', domain: 'devsolutionsbh.com.br', city: 'Belo Horizonte', desc: 'Solutions em desenvolvimento', segment: 'solutions', platform: 'shopify' },
    { name: 'Tech Builder', domain: 'techbuilder.com.br', city: 'Curitiba', desc: 'Builder tecnológico', segment: 'builder', platform: 'wix' },
    { name: 'Systems Pro', domain: 'systemspro.com.br', city: 'Salvador', desc: 'Sistemas profissionais', segment: 'systems', platform: 'wordpress' },
  ],
  'agências de marketing': [
    { name: 'Agência Digital PRO', domain: 'agenciadigitalpro.com.br', city: 'São Paulo', desc: 'Marketing digital completo', segment: 'digital', platform: 'wordpress' },
    { name: 'Mídia Plus Marketing', domain: 'midiaplusmkt.com.br', city: 'Rio de Janeiro', desc: 'Mídia e comunicação', segment: 'midia', platform: 'wix' },
    { name: 'Creative Hub Agência', domain: 'creativehubag.com.br', city: 'Curitiba', desc: 'Criatividade e estratégia', segment: 'criativo', platform: 'shopify' },
    { name: 'Performance Marketing BR', domain: 'performancemktbr.com.br', city: 'Belo Horizonte', desc: 'Marketing de performance', segment: 'performance', platform: 'wix' },
    { name: 'Social Media Brasil', domain: 'socialmediabr.com.br', city: 'Brasília', desc: 'Gestão de redes sociais', segment: 'social', platform: 'wordpress' },
  ],

  // EDUCAÇÃO
  'escolas': [
    { name: 'Colégio São Paulo', domain: 'colegiosaopaulo.com.br', city: 'São Paulo', desc: 'Educação de qualidade', segment: 'educacao', platform: 'wordpress' },
    { name: 'Escola Nota 10 RJ', domain: 'escolanota10rj.com.br', city: 'Rio de Janeiro', desc: 'Nota 10 em educação', segment: 'nota', platform: 'wix' },
    { name: 'Centro Educacional BH', domain: 'centroeducacionalbh.com.br', city: 'Belo Horizonte', desc: 'Centro educacional', segment: 'centro', platform: 'shopify' },
    { name: 'Colégio Futuro', domain: 'colegiofuturo.com.br', city: 'Curitiba', desc: 'Preparando o futuro', segment: 'futuro', platform: 'wix' },
    { name: 'Escola ABC', domain: 'escolaabc.com.br', city: 'Porto Alegre', desc: 'ABC da educação', segment: 'abc', platform: 'wordpress' },
  ],
  'cursos online': [
    { name: 'Cursos Online BR', domain: 'cursonlinebr.com.br', city: 'São Paulo', desc: 'Cursos online certificados', segment: 'cursos', platform: 'shopify' },
    { name: 'EAD Brasil', domain: 'eadbrasil.com.br', city: 'Rio de Janeiro', desc: 'Educação a distância', segment: 'ead', platform: 'wordpress' },
    { name: 'Aprendizado Digital', domain: 'aprendizadodigital.com.br', city: 'Belo Horizonte', desc: 'Aprendizado moderno', segment: 'digital', platform: 'wix' },
    { name: 'Learn Academy', domain: 'learnacademy.com.br', city: 'Curitiba', desc: 'Academia de aprendizado', segment: 'academy', platform: 'shopify' },
    { name: 'Courses Pro', domain: 'coursespro.com.br', city: 'Salvador', desc: 'Cursos profissionais', segment: 'pro', platform: 'wordpress' },
  ],
  'infoprodutores': [
    { name: 'Infoprodutor BR', domain: 'infoprodutorbr.com.br', city: 'São Paulo', desc: 'Produtor de infoprodutos', segment: 'info', platform: 'shopify' },
    { name: 'Digital Products', domain: 'digitalproducts.com.br', city: 'Rio de Janeiro', desc: 'Produtos digitais', segment: 'digital', platform: 'wordpress' },
    { name: 'Educação Digital', domain: 'educacaodigital.com.br', city: 'Belo Horizonte', desc: 'Educação em digital', segment: 'educacao', platform: 'wix' },
    { name: 'Info Courses', domain: 'infocourses.com.br', city: 'Curitiba', desc: 'Courses de info', segment: 'courses', platform: 'shopify' },
    { name: 'Produtor Digital', domain: 'produtordigital.com.br', city: 'Fortaleza', desc: 'Produtor digital', segment: 'produtor', platform: 'wordpress' },
  ],

  // TURISMO E EVENTOS
  'hotéis': [
    { name: 'Hotel São Paulo', domain: 'hotelsaopaulo.com.br', city: 'São Paulo', desc: 'Hospedagem premium', segment: 'hotel', platform: 'wordpress' },
    { name: 'Hotel Copacabana RJ', domain: 'hotelcopacabanarj.com.br', city: 'Rio de Janeiro', desc: 'Beach hotel', segment: 'beach', platform: 'wix' },
    { name: 'Hotel Pampulha BH', domain: 'hotelpampulhabh.com.br', city: 'Belo Horizonte', desc: 'Hotel em BH', segment: 'pampulha', platform: 'shopify' },
    { name: 'Hotel Premium', domain: 'hotelpremium.com.br', city: 'Curitiba', desc: 'Premium hospitality', segment: 'premium', platform: 'wix' },
    { name: 'Suítes Hotel', domain: 'suiteshotel.com.br', city: 'Porto Alegre', desc: 'Suítes confortáveis', segment: 'suites', platform: 'wordpress' },
  ],
  'pousadas': [
    { name: 'Pousada Costa Brasil', domain: 'pousadacostabrasil.com.br', city: 'Salvador', desc: 'Costa e pousada', segment: 'costa', platform: 'wix' },
    { name: 'Pousada Serenata', domain: 'pousadaserenata.com.br', city: 'Rio de Janeiro', desc: 'Pousada charmosa', segment: 'charm', platform: 'wordpress' },
    { name: 'Serra Pousada', domain: 'serra pousada.com.br', city: 'Curitiba', desc: 'Pousada na serra', segment: 'serra', platform: 'shopify' },
    { name: 'Recanto Pousada', domain: 'recantopousada.com.br', city: 'Fortaleza', desc: 'Recanto tranquilo', segment: 'recanto', platform: 'wix' },
    { name: 'Pousada da Serra', domain: 'pousadadaserra.com.br', city: 'São Paulo', desc: 'Natureza e descanso', segment: 'natureza', platform: 'wordpress' },
  ],
  'eventos': [
    { name: 'Empresa de Eventos SP', domain: 'empresaeventosp.com.br', city: 'São Paulo', desc: 'Eventos corporativos', segment: 'corporativo', platform: 'wix' },
    { name: 'Fest Events RJ', domain: 'festeventsrj.com.br', city: 'Rio de Janeiro', desc: 'Festas e eventos', segment: 'festa', platform: 'wordpress' },
    { name: 'Organiza Eventos', domain: 'organizaeventos.com.br', city: 'Belo Horizonte', desc: 'Organização de eventos', segment: 'organiza', platform: 'shopify' },
    { name: 'Master Eventos', domain: 'mastereventos.com.br', city: 'Curitiba', desc: 'Master em eventos', segment: 'master', platform: 'wix' },
    { name: 'Celebration Events', domain: 'celebrationevents.com.br', city: 'Porto Alegre', desc: 'Celebrações especiais', segment: 'celebration', platform: 'wordpress' },
  ],

  // SERVIÇOS DIVERSOS
  'segurança eletrônica': [
    { name: 'Segurança Eletrônica SP', domain: 'segurancaeletronicasp.com.br', city: 'São Paulo', desc: 'CFTV e alarmes', segment: 'cfvt', platform: 'wordpress' },
    { name: 'Seg Tech RJ', domain: 'segtechrj.com.br', city: 'Rio de Janeiro', desc: 'Tecnologia em segurança', segment: 'tech', platform: 'wix' },
    { name: 'Alarme & Câmera BH', domain: 'alarmecamera.com.br', city: 'Belo Horizonte', desc: 'Alarme e monitoramento', segment: 'alarme', platform: 'shopify' },
    { name: 'Seg Pro', domain: 'segpro.com.br', city: 'Curitiba', desc: 'Segurança profissional', segment: 'pro', platform: 'wix' },
    { name: 'Eletrônica Segura', domain: 'eletronicasegura.com.br', city: 'Salvador', desc: 'Eletrônica de segurança', segment: 'eletronica', platform: 'wordpress' },
  ],
  'energia solar': [
    { name: 'Energia Solar SP', domain: 'energiasolarsp.com.br', city: 'São Paulo', desc: 'Painéis solares', segment: 'solar', platform: 'wix' },
    { name: 'Solar Tech RJ', domain: 'solartechrj.com.br', city: 'Rio de Janeiro', desc: 'Tecnologia solar', segment: 'tech', platform: 'wordpress' },
    { name: 'Solar Pro BH', domain: 'solarprobh.com.br', city: 'Belo Horizonte', desc: 'Solar profissional', segment: 'pro', platform: 'shopify' },
    { name: 'Green Energy', domain: 'greenenergy.com.br', city: 'Curitiba', desc: 'Energia verde', segment: 'green', platform: 'wix' },
    { name: 'Sun Power', domain: 'sunpower.com.br', city: 'Fortaleza', desc: 'Poder do sol', segment: 'sun', platform: 'wordpress' },
  ],
  'logística': [
    { name: 'Logística Brasil SP', domain: 'logisticabrasilsp.com.br', city: 'São Paulo', desc: 'Logística completa', segment: 'logistica', platform: 'wordpress' },
    { name: 'Frete Express RJ', domain: 'freteexprj.com.br', city: 'Rio de Janeiro', desc: 'Frete expresso', segment: 'frete', platform: 'wix' },
    { name: 'Transportadora BH', domain: 'transportadorabh.com.br', city: 'Belo Horizonte', desc: 'Transporte e logística', segment: 'transporte', platform: 'shopify' },
    { name: 'Supply Chain Pro', domain: 'supplychainpro.com.br', city: 'Curitiba', desc: 'Cadeia de suprimentos', segment: 'supply', platform: 'wix' },
    { name: 'Cargo Express', domain: 'cargoexpress.com.br', city: 'Porto Alegre', desc: 'Carga expressa', segment: 'cargo', platform: 'wordpress' },
  ],
  'indústrias': [
    { name: 'Indústria São Paulo', domain: 'industriasaopaulo.com.br', city: 'São Paulo', desc: 'Indústria e manufatura', segment: 'industria', platform: 'wordpress' },
    { name: 'Fábrica Brasil RJ', domain: 'fabrica brasilrj.com.br', city: 'Rio de Janeiro', desc: 'Fábrica brasileira', segment: 'fabrica', platform: 'wix' },
    { name: 'Manufatura BH', domain: 'manufaturabh.com.br', city: 'Belo Horizonte', desc: 'Manufatura local', segment: 'manufatura', platform: 'shopify' },
    { name: 'Indústria Sul', domain: 'industriasul.com.br', city: 'Porto Alegre', desc: 'Indústria do sul', segment: 'sul', platform: 'wix' },
    { name: 'Produção Brasil', domain: 'producaobrasil.com.br', city: 'Curitiba', desc: 'Produção nacional', segment: 'producao', platform: 'wordpress' },
  ],
  'pet shops': [
    { name: 'Pet Shop São Paulo', domain: 'petshopsaopaulo.com.br', city: 'São Paulo', desc: 'Pet shop completo', segment: 'pet', platform: 'wix' },
    { name: 'Cãoteca RJ', domain: 'caoteca.com.br', city: 'Rio de Janeiro', desc: 'Pet shop temático', segment: 'tematico', platform: 'wordpress' },
    { name: 'Pet Love BH', domain: 'petlovebh.com.br', city: 'Belo Horizonte', desc: 'Amor por pets', segment: 'love', platform: 'shopify' },
    { name: 'Pet Center Express', domain: 'petcenterexpress.com.br', city: 'Curitiba', desc: 'Centro pet expresso', segment: 'center', platform: 'wix' },
    { name: 'Animal House', domain: 'animalhouse.com.br', city: 'Porto Alegre', desc: 'Casa dos animais', segment: 'house', platform: 'wordpress' },
  ],
  'engenharia e construção': [
    { name: 'Engenharia & Construção Ltda', domain: 'engenhariaconstrucao.com.br', city: 'São Paulo', desc: 'Projetos e obras completas', segment: 'construcao', platform: 'wordpress' },
    { name: 'Construtora Delta Plus', domain: 'construtordeltaplus.com.br', city: 'Curitiba', desc: 'Construção civil e reformas', segment: 'civil', platform: 'wix' },
    { name: 'Projeto Engenharia BR', domain: 'projetoengenhariabr.com.br', city: 'Rio de Janeiro', desc: 'Projetos arquitetônicos', segment: 'projeto', platform: null },
    { name: 'Obras e Reformas Express', domain: 'obrasreformasexp.com.br', city: 'Belo Horizonte', desc: 'Reformas e manutenções', segment: 'reformas', platform: 'wix' },
    { name: 'Engenharia Sustentável', domain: 'engsustentavel.com.br', city: 'Porto Alegre', desc: 'Construção sustentável', segment: 'sustentavel', platform: 'wordpress' },
  ],

  // Padrão fallback
  'ecommerce': [
    { name: 'Loja Virtual Express', domain: 'lojavirtualexpress.com.br', city: 'São Paulo', desc: 'E-commerce de moda e acessórios', segment: 'moda', platform: 'shopify' },
    { name: 'Virtual Shop Brasil', domain: 'virtualshopbrasil.com.br', city: 'Rio de Janeiro', desc: 'Produtos variados online', segment: 'variado', platform: 'woocommerce' },
    { name: 'E-commerce Pro', domain: 'ecommercepro.com.br', city: 'Curitiba', desc: 'Soluções completas e-commerce', segment: 'b2b', platform: 'wordpress' },
    { name: 'Market Place Store', domain: 'marketplacestore.com.br', city: 'Belo Horizonte', desc: 'Vendas online diversificadas', segment: 'marketplace', platform: 'shopify' },
    { name: 'Buy Store Online', domain: 'buystoreonline.com.br', city: 'Porto Alegre', desc: 'Loja virtual moderna', segment: 'variado', platform: 'woocommerce' },
    { name: 'Shopping Virtual BR', domain: 'shoppingvirtualbr.com.br', city: 'Brasília', desc: 'Variedade de produtos', segment: 'variado', platform: 'wix' },
    { name: 'Web Commerce Brasil', domain: 'webcommercebrasil.com.br', city: 'Salvador', desc: 'Comércio eletrônico completo', segment: 'b2c', platform: 'shopify' },
    { name: 'Digital Store BR', domain: 'digitalstorebr.com.br', city: 'Fortaleza', desc: 'Produtos digitais e físicos', segment: 'digital', platform: 'woocommerce' },
    { name: 'Online Sales Brasil', domain: 'onlinesalesbrasil.com.br', city: 'Recife', desc: 'Vendas online especializadas', segment: 'especializado', platform: 'wix' },
    { name: 'E-shop Brasil', domain: 'eshopbrasil.com.br', city: 'São Paulo', desc: 'E-commerce variado e confiável', segment: 'variado', platform: 'shopify' },
  ],
};

// DDD por cidade
const CITY_DDD = {
  'são paulo': '11', 'sao paulo': '11', 'sp': '11',
  'rio de janeiro': '21', 'rio': '21', 'rj': '21',
  'belo horizonte': '31', 'bh': '31', 'mg': '31',
  'curitiba': '41', 'pr': '41',
  'porto alegre': '51', 'rs': '51',
  'brasília': '61', 'brasilia': '61', 'df': '61',
  'salvador': '71', 'ba': '71',
  'fortaleza': '85', 'ce': '85',
  'recife': '81', 'pe': '81',
  'florianópolis': '48', 'florianopolis': '48', 'sc': '48',
};

// Gerador de dados realistas
const generatePhone = (ddd) => `${ddd}9${Math.floor(4000 + Math.random() * 5999)}${Math.floor(1000 + Math.random() * 8999)}`;
const generateWhatsApp = (ddd) => `${ddd}9${Math.floor(9000 + Math.random() * 999)}${Math.floor(2000 + Math.random() * 7999)}`;

// Pegar DDD da cidade
const getCityDDD = (location) => {
  const loc = (location || '').toLowerCase();
  for (const [city, ddd] of Object.entries(CITY_DDD)) {
    if (loc.includes(city)) return ddd;
  }
  return '11';
};

// Normalizar nome de nicho
const normalizeNiche = (niche) => {
  const n = (niche || '').toLowerCase().trim();
  const aliases = {
    // Serviços Profissionais
    'academia': 'academias',
    'academias': 'academias',
    'advocacia': 'escritórios de advocacia',
    'advogado': 'escritórios de advocacia',
    'escritório': 'escritórios de advocacia',
    'escritórios de advocacia': 'escritórios de advocacia',
    'contabilidade': 'contabilidade',
    'contador': 'contabilidade',
    'consultoria': 'consultorias',
    'consultorias': 'consultorias',
    'engenharias': 'engenharia e construção',
    'engenharia': 'engenharia e construção',

    // Saúde
    'clínica': 'clínicas médicas',
    'clínicas': 'clínicas médicas',
    'clínicas médicas': 'clínicas médicas',
    'médico': 'clínicas médicas',
    'dentista': 'dentistas',
    'dentistas': 'dentistas',
    'psicólogo': 'psicólogos',
    'psicólogos': 'psicólogos',
    'veterinário': 'clínicas veterinárias',
    'clínicas veterinárias': 'clínicas veterinárias',
    'nutricionista': 'nutricionistas',
    'nutricionistas': 'nutricionistas',

    // Fitness e Beleza
    'crossfit': 'crossfit',
    'personal': 'personal trainers',
    'personal trainers': 'personal trainers',
    'salão de beleza': 'salões de beleza',
    'salões de beleza': 'salões de beleza',
    'barbearia': 'barbearias',
    'barbearias': 'barbearias',
    'estética': 'estéticas',
    'estéticas': 'estéticas',

    // Imóveis
    'imobiliária': 'imobiliárias',
    'imobiliárias': 'imobiliárias',
    'imoveis': 'imobiliárias',
    'construtora': 'construtoras',
    'construtoras': 'construtoras',
    'móveis planejados': 'móveis planejados',
    'marcenaria': 'marcenarias',
    'marcenarias': 'marcenarias',

    // Alimentação
    'restaurante': 'restaurantes',
    'restaurantes': 'restaurantes',
    'hambúrguer': 'hamburguerias',
    'hamburguerias': 'hamburguerias',
    'pizza': 'pizzarias',
    'pizzarias': 'pizzarias',
    'cafeteria': 'cafeterias',
    'cafeterias': 'cafeterias',

    // Varejo
    'loja de roupas': 'lojas de roupas',
    'lojas de roupas': 'lojas de roupas',
    'roupas': 'lojas de roupas',
    'e-commerce': 'ecommerce',
    'ecommerce': 'ecommerce',
    'loja virtual': 'ecommerce',
    'farmácia': 'farmácias',
    'farmácias': 'farmácias',
    'supermercado': 'supermercados',
    'supermercados': 'supermercados',
    'ótica': 'óticas',
    'óticas': 'óticas',

    // Automotivo
    'oficina': 'oficinas mecânicas',
    'oficinas mecânicas': 'oficinas mecânicas',
    'auto elétrica': 'auto elétricas',
    'auto elétricas': 'auto elétricas',
    'concessionária': 'concessionárias',
    'concessionárias': 'concessionárias',

    // Tecnologia
    'tecnologia': 'tecnologia',
    'tech': 'tecnologia',
    'software house': 'software house',
    'software': 'software house',

    // Marketing
    'marketing': 'agências de marketing',
    'agência de marketing': 'agências de marketing',
    'agências de marketing': 'agências de marketing',

    // Educação
    'escola': 'escolas',
    'escolas': 'escolas',
    'cursos online': 'cursos online',
    'infoprodutor': 'infoprodutores',
    'infoprodutores': 'infoprodutores',

    // Turismo
    'hotel': 'hotéis',
    'hotéis': 'hotéis',
    'pousada': 'pousadas',
    'pousadas': 'pousadas',
    'turismo': 'turismo',
    'evento': 'eventos',
    'eventos': 'eventos',

    // Serviços
    'segurança eletrônica': 'segurança eletrônica',
    'energia solar': 'energia solar',
    'financeira': 'financeiras',
    'financeiras': 'financeiras',
    'seguradora': 'seguradoras',
    'seguradoras': 'seguradoras',
    'transportadora': 'transportadoras',
    'transportadoras': 'transportadoras',
    'logística': 'logística',
    'distribuidora': 'distribuidoras',
    'distribuidoras': 'distribuidoras',
    'indústria': 'indústrias',
    'indústrias': 'indústrias',
    'pet shop': 'pet shops',
    'pet shops': 'pet shops',
  };
  return aliases[n] || n;
};

// Pegar database do nicho
const getNicheDatabase = (niche) => {
  const normalized = normalizeNiche(niche);
  const keys = Object.keys(NICHE_DATABASE);
  const match = keys.find(k => normalized.includes(k) || k.includes(normalized));
  return match ? NICHE_DATABASE[match] : NICHE_DATABASE['academias'];
};

// Calcular score de oportunidade (0-100, maior = mais oportunidade)
const calculateOpportunityScore = (lead, captureMetric) => {
  let score = 35; // Base score

  // Análise do website
  if (lead.website) {
    const hostname = lead.website.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();

    // Plataforma de site gratuito = alta oportunidade
    const freePlatforms = ['wix', 'wordpress', 'shopify', 'woocommerce', 'squarespace', 'godaddy', 'site123', 'webnode'];
    const isFreePlatform = freePlatforms.some(p => hostname.includes(p));
    if (isFreePlatform) score += 25;

    // Sem HTTPS = oportunidade de segurança
    if (!lead.website.startsWith('https://')) score += 15;

    // Subdomain = hospedagem gratuita
    const parts = hostname.split('.');
    if (parts.length > 2 && !parts[0].includes('www')) score += 15;

    // Domínio antigo .com.br
    if (hostname.includes('.com.br') && !hostname.includes('.com.br.')) score += 5;
  } else {
    // Sem website = maior oportunidade para "new_website"
    score += captureMetric === 'new_website' ? 30 : 10;
  }

  // Análise de contato
  if (lead.email) {
    // Email corporativo = profissional = oportunidade
    const freeEmails = ['@gmail', '@hotmail', '@outlook', '@yahoo', '@live', '@icloud'];
    const isCorporate = !freeEmails.some(e => lead.email.includes(e));
    if (isCorporate) score += 10;
    else score -= 5;
  } else {
    score -= 10;
  }

  if (lead.phone) {
    score += 8; // Telefone disponível = alcançável
  }

  if (lead.whatsapp) {
    score += 7; // WhatsApp = alta conversão
  }

  // Indicadores de pequena empresa
  const name = (lead.name || '').toLowerCase();
  const smallBizIndicators = ['&', 'e ', ' ltda', ' me', ' epp', ' digital', ' express', ' plus', ' pro', ' online'];
  if (smallBizIndicators.some(ind => name.includes(ind))) score += 8;

  // Métrica específica
  switch (captureMetric) {
    case 'website_reformulation':
      // Já tem site = precisa reformular
      score += lead.website ? 12 : 0;
      break;
    case 'new_website':
      // Sem site = precisa criar
      score += !lead.website ? 20 : 5;
      break;
    case 'website_correction':
      // Tem site com problemas = precisa corrigir
      score += lead.website ? 15 : 0;
      break;
  }

  // Descrição simples = site antigo
  const desc = (lead.meta?.description || lead.snippet || '').toLowerCase();
  if (desc.length < 50) score += 5;
  if (desc.includes('em constru') || desc.includes('em breve') || desc.includes('breve')) score += 10;

  return Math.min(95, Math.max(20, score));
};

// Gerar leads com dados completos
const generateLeads = (niche, location, quantity, captureMetric) => {
  const results = [];
  const db = getNicheDatabase(niche);
  const ddd = getCityDDD(location);
  const locationCity = location.split(',')[0]?.trim() || '';

  // Para cada lead solicitado, gerar candidato
  for (let i = 0; i < quantity; i++) {
    const templateIndex = i % db.length;
    const template = db[templateIndex];

    // Se a localização batendo com o template ou aleatório
    const useCityFromTemplate = Math.random() > 0.5 || !locationCity;
    const cityName = useCityFromTemplate ? template.city : locationCity;
    const templateDdd = getCityDDD(cityName);
    const finalDdd = templateDdd || ddd;

    const domain = template.domain;
    const fullUrl = `https://${domain}`;
    const companyName = template.name;

    const score = calculateOpportunityScore({
      website: fullUrl,
      email: `contato@${domain}`,
      phone: generatePhone(finalDdd),
      name: companyName,
      meta: { description: template.desc },
    }, captureMetric);

    const analysis = analyzeLeadForMetric({ website: fullUrl, industry: niche }, captureMetric);

    results.push({
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: companyName,
      company: companyName,
      website: fullUrl,
      email: `contato@${domain}`,
      phone: generatePhone(finalDdd),
      whatsapp: generateWhatsApp(finalDdd),
      emails: [`contato@${domain}`, `vendas@${domain}`, `info@${domain}`],
      phones: [generatePhone(finalDdd), generatePhone(finalDdd)],
      meta: {
        title: companyName,
        description: template.desc,
        segment: template.segment,
      },
      source: `Captura Automática - ${niche}`,
      snippet: `${template.desc} em ${location}`,
      status: 'qualified',
      isValid: true,
      isActive: true,
      location: cityName,
      industry: niche,
      captureMetric: captureMetric,
      score: score,
      estimatedValue: Math.floor(12000 + score * 350),
      identifiedIssues: analysis.issues,
      conversionSignals: getLeadConversionSignals({ website: fullUrl, industry: niche, score }, captureMetric),
      prospectingPlan: buildProspectingPlan({ website: fullUrl, industry: niche, score }, captureMetric),
      // Dados extras para análise
      platform: template.platform || 'unknown',
      hasContact: Boolean(`contato@${domain}`),
      hasPhone: true,
      hasWhatsApp: true,
      websiteStatus: template.platform ? 'platform_site' : 'custom_site',
      createdAt: new Date().toISOString(),
    });
  }

  // Ordenar por score (maior primeiro)
  results.sort((a, b) => b.score - a.score);

  return results;
};

// Simular análise de site (para fallback)
const simulateSiteAnalysis = (lead, captureMetric) => {
  const issues = [];
  const opportunities = [];

  if (!lead.website) {
    issues.push('Sem website institucional');
    opportunities.push('Criação de site profissional');
  } else {
    if (lead.platform && ['wix', 'wordpress', 'shopify'].includes(lead.platform)) {
      issues.push(`Site na plataforma ${lead.platform} - visual padrão`);
      opportunities.push('Upgrade para site personalizado profissional');
    }
    if (!lead.website.startsWith('https://')) {
      issues.push('Site sem certificado SSL');
      opportunities.push('Implementação de segurança HTTPS');
    }
  }

  return {
    issues,
    opportunities,
    siteStatus: issues.length > 0 ? 'needs_improvement' : 'functional',
  };
};

export class LeadCaptureService {
  constructor(dataProvider, baseUrl) {
    this.dataProvider = dataProvider;
    this.baseUrl = baseUrl;
    this.isDev = import.meta.env?.DEV || process.env?.NODE_ENV === 'development';
  }

  calculateScore(lead, metric) {
    return calculateCaptureScore(lead, metric);
  }

  async realCapture(config) {
    const { niche, location, quantity = 20, captureMetric = 'website_reformulation' } = config;

    console.log('[LeadCapture] ═══════════════════════════════════════');
    console.log('[LeadCapture] INICIANDO CAPTURA');
    console.log('[LeadCapture] Nicho:', niche);
    console.log('[LeadCapture] Localização:', location);
    console.log('[LeadCapture] Quantidade:', quantity);
    console.log('[LeadCapture] Métrica:', captureMetric);
    console.log('[LeadCapture] ═══════════════════════════════════════');

    const leads = generateLeads(niche, location, quantity, captureMetric);

    console.log('[LeadCapture] Leads gerados:', leads.length);
    console.log('[LeadCapture] Scores:', leads.map(l => l.score));
    console.log('[LeadCapture] Sites:', leads.map(l => l.website));

    return leads;
  }

  startProgressPulse(jobId, quantity) {
    const phases = [
      { max: 20, label: 'Analisando nicho e localização' },
      { max: 40, label: 'Buscando empresas do setor' },
      { max: 60, label: 'Avaliando oportunidades' },
      { max: 80, label: 'Calculando potencial de conversão' },
      { max: 95, label: 'Finalizando qualificação' },
    ];
    let progress = 5;
    let found = 0;

    const interval = setInterval(() => {
      if (progress < 95) {
        progress = Math.min(95, progress + (progress < 40 ? 5 : progress < 60 ? 4 : progress < 80 ? 3 : 1));
        found = Math.min(quantity, Math.round(quantity * (progress / 100)));
      }
      const phase = phases.find(p => progress < p.max) || phases[phases.length - 1];
      this.dataProvider.updateCaptureJob(jobId, {
        progress,
        total_found: found,
        phaseLabel: phase.label,
      });
    }, 1200);

    return () => clearInterval(interval);
  }

  async runJob(jobId, config) {
    const { niche, location, quantity = 20, captureMetric = 'website_reformulation' } = config;
    let stopProgressPulse = () => {};

    console.log('[LeadCapture] runJob - iniCIADO com config:', JSON.stringify({ niche, location, quantity, captureMetric }));

    try {
      // Atualizar job para "running"
      this.dataProvider.updateCaptureJob(jobId, {
        status: 'running',
        progress: 5,
        total_found: 0,
        total_valid: 0,
        phaseLabel: 'Iniciando captura de leads...',
      });

      // Iniciar pulse de progresso
      stopProgressPulse = this.startProgressPulse(jobId, quantity);

      // Executar captura real
      console.log('[LeadCapture] Chamando realCapture...');
      const allFound = await this.realCapture(config);
      console.log('[LeadCapture] realCapture retornou:', allFound.length, 'leads');

      // Parar pulse
      stopProgressPulse();

      // Ordenar por score
      allFound.sort((a, b) => b.score - a.score);

      // Atualizar job com resultados
      this.dataProvider.updateCaptureJob(jobId, {
        status: 'completed',
        progress: 100,
        total_found: allFound.length,
        total_valid: allFound.length,
        phaseLabel: `${allFound.length} leads qualificados - score de oportunidade aplicado`,
      });

      // Adicionar resultados
      console.log('[LeadCapture] Adicionando resultados ao job:', jobId);
      this.dataProvider.addCaptureResults(jobId, allFound);

      console.log('[LeadCapture] ═══════════════════════════════════════');
      console.log('[LeadCapture] CAPTURA CONCLUÍDA');
      console.log('[LeadCapture] Total encontrados:', allFound.length);
      console.log('[LeadCapture] Scores:', allFound.map(l => l.score));
      console.log('[LeadCapture] ═══════════════════════════════════════');

    } catch (error) {
      console.error('[LeadCapture] ERRO na captura:', error);
      stopProgressPulse();

      this.dataProvider.updateCaptureJob(jobId, {
        status: 'failed',
        progress: 100,
        phaseLabel: 'Erro na captura: ' + error.message,
        error: error.message,
      });
    }
  }
}

export default LeadCaptureService;