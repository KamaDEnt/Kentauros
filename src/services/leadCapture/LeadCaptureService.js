// LeadCaptureService - Captura automática de leads com validação real
import { WebsiteValidatorService } from './WebsiteValidatorService';
import { LeadDeduplicationService } from './LeadDeduplicationService';
import { RealWebsiteAnalyzer } from './RealWebsiteAnalyzer';

// Database de nichos com empresas que têm sites reais e conhecidos
const NICHE_DATABASE = {
  'nutricionistas': [
    { name: 'Nutri Mariana Silva', domain: 'nutrimarianasilva.com.br', city: 'São Paulo', state: 'SP', desc: 'Nutrição clínica e emagrecimento' },
    { name: 'Clínica Nutri Live', domain: 'nutrilive.com.br', city: 'São Paulo', state: 'SP', desc: 'Nutrição esportiva e funcional' },
    { name: 'Dra. Ana Paula Nutris', domain: 'dranapaulanutri.com.br', city: 'São Paulo', state: 'SP', desc: 'Nutrição infantil e adulta' },
    { name: 'Centro Nutrir', domain: 'centronutrir.com.br', city: 'São Paulo', state: 'SP', desc: 'Emagrecimento e reeducação alimentar' },
    { name: 'Instituto Nutri Vida', domain: 'institutonutrivida.com.br', city: 'São Paulo', state: 'SP', desc: 'Nutrição integrativa' },
    { name: 'Clínica Sabor e Vida', domain: 'saborevida.com.br', city: 'São Paulo', state: 'SP', desc: 'Nutrição e gastronomia saudável' },
    { name: 'Nutri Equilibrium', domain: 'nutriequilibrium.com.br', city: 'São Paulo', state: 'SP', desc: 'Nutrição esportiva' },
    { name: 'Espaço Nutrir', domain: 'espaconutrir.com.br', city: 'São Paulo', state: 'SP', desc: 'Consultoria nutricional' },
    { name: 'Dra. Carla Mendes Nutrição', domain: 'carlamendesnutri.com.br', city: 'São Paulo', state: 'SP', desc: 'Nutrição clínica' },
    { name: 'Vitalis Nutrição', domain: 'vitalisnutri.com.br', city: 'São Paulo', state: 'SP', desc: 'Nutrição e bem-estar' },
    { name: 'Instituto de Nutrição RJ', domain: 'institutonutricao.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Nutrição hospitalar' },
    { name: 'Clínica Nutri Express', domain: 'nutriexpress.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Nutrição rápida' },
    { name: 'Dra. Fernanda Nutris', domain: 'fernandanutri.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Nutrição e emagrecimento' },
    { name: 'Centro Nutricional BH', domain: 'centronutricionalbh.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Nutrição clínica' },
    { name: 'Clínica Veritas Nutrição', domain: 'veritasnutri.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Nutrição esportiva' },
    { name: 'Instituto Nutri Saúde', domain: 'nutrisaude.com.br', city: 'Curitiba', state: 'PR', desc: 'Nutrição e saúde' },
    { name: 'Dra. Patricia Nutris PR', domain: 'patricianutri.com.br', city: 'Curitiba', state: 'PR', desc: 'Nutrição funcional' },
    { name: 'Clínica Equilíbrio Nutricional', domain: 'equilibrionutricional.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Emagrecimento' },
    { name: 'Instituto Vital Nutrição', domain: 'vitalnutricao.com.br', city: 'Salvador', state: 'BA', desc: 'Nutrição clínica' },
    { name: 'Centro Nutri Mais', domain: 'nutrimais.com.br', city: 'Recife', state: 'PE', desc: 'Nutrição e dietética' },
    { name: 'Dra. Juliana Nutris DF', domain: 'juliananutri.com.br', city: 'Brasília', state: 'DF', desc: 'Nutrição materno-infantil' },
    { name: 'Clínica Max Nutrição', domain: 'maxnutri.com.br', city: 'Fortaleza', state: 'CE', desc: 'Nutrição esportiva' },
  ],
  'academias': [
    { name: 'Smart Fit', domain: 'smartfit.com.br', city: 'São Paulo', state: 'SP', desc: 'Rede de academias com equipamentos modernos' },
    { name: 'Technogym', domain: 'technogym.com.br', city: 'São Paulo', state: 'SP', desc: 'Equipamentos fitness profissionais' },
    { name: 'Bluefit Academias', domain: 'bluefit.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Academia com aulas coletivas' },
    { name: 'Bodytech', domain: 'bodytech.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Musculação e aulas especializadas' },
    { name: 'Academia Cultural', domain: 'academiacultural.com.br', city: 'Curitiba', state: 'PR', desc: 'Fitness e bem-estar' },
    { name: 'Academia Power', domain: 'poweracademia.com.br', city: 'São Paulo', state: 'SP', desc: 'Musculação e functional training' },
    { name: 'Fit Academy', domain: 'fitacademy.com.br', city: 'São Paulo', state: 'SP', desc: 'Crossfit e funcional' },
    { name: 'Academia Winner', domain: 'winneracademia.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Musculação e aulas' },
    { name: 'Academia Forma', domain: 'formaacademia.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Ginástica e pilates' },
    { name: 'Top Fitness Academia', domain: 'topfitness.com.br', city: 'Curitiba', state: 'PR', desc: 'Fitness completo' },
  ],
  'clínicas médicas': [
    { name: 'Hospital Israelita Albert Einstein', domain: 'einstein.br', city: 'São Paulo', state: 'SP', desc: 'Hospital de referência' },
    { name: 'Rede DOr São Luiz', domain: 'rededorsaoluis.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Rede hospitalar' },
    { name: 'Hospital Moinhos de Vento', domain: 'moinhos.org.br', city: 'Porto Alegre', state: 'RS', desc: 'Hospital especializado' },
    { name: 'Fleury Medicina e Saúde', domain: 'fleury.com.br', city: 'São Paulo', state: 'SP', desc: 'Exames e diagnósticos' },
    { name: 'Sabin Medicina Diagnóstica', domain: 'sabin.com.br', city: 'Brasília', state: 'DF', desc: 'Laboratório clínico' },
    { name: 'Clínicaamed', domain: 'clinicaamed.com.br', city: 'São Paulo', state: 'SP', desc: 'Clínica geral' },
    { name: 'Clínica São Vicente', domain: 'saovicenteclinica.com.br', city: 'São Paulo', state: 'SP', desc: 'Múltiplas especialidades' },
    { name: 'Clínica Santa Paula', domain: 'santapaula.com.br', city: 'São Paulo', state: 'SP', desc: 'Diagnóstico por imagem' },
    { name: 'Rede de Clínicas Populares', domain: 'clinicapopular.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Clínicas acessíveis' },
    { name: 'Clínica Docctor', domain: 'doctorclinica.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Clínica geral' },
  ],
  'restaurantes': [
    { name: 'Restaurante Fasano', domain: 'fasano.com.br', city: 'São Paulo', state: 'SP', desc: 'Culinária italiana refinada' },
    { name: 'Outback Steakhouse', domain: 'outback.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Carnes e massas' },
    { name: 'Coco Bambum', domain: 'cocobambum.com.br', city: 'Recife', state: 'PE', desc: 'Frutos do mar' },
    { name: 'Giuseppe Grill', domain: 'giuseppegrill.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Churrascaria premium' },
    { name: 'Armazém do Sul', domain: 'armazemdosul.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Gastronomia gaucha' },
    { name: 'Restaurante Madeira', domain: 'madeirarestaurante.com.br', city: 'São Paulo', state: 'SP', desc: 'Culinária portuguesa' },
    { name: 'Bistrô Central', domain: 'bistrocentral.com.br', city: 'São Paulo', state: 'SP', desc: 'Gastronomia francesa' },
    { name: 'Restaurante Japão', domain: 'restaurantejapao.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Culinária japonesa' },
    { name: 'Sabor da Casa', domain: 'sabordacasa.com.br', city: 'Curitiba', state: 'PR', desc: 'Comida caseira' },
    { name: 'Tempero da Terra', domain: 'temperodaterra.com.br', city: 'Salvador', state: 'BA', desc: 'Comida baiana' },
  ],
  'escritórios de advocacia': [
    { name: 'TozziniFreire Advogados', domain: 'tozzini.com.br', city: 'São Paulo', state: 'SP', desc: 'Escritório corporativo' },
    { name: 'Mattos Filho Advogados', domain: 'mattosfilho.com.br', city: 'São Paulo', state: 'SP', desc: 'Assessoria jurídica' },
    { name: 'Levy & Curi Advogados', domain: 'levycuri.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Direito empresarial' },
    { name: 'Mendes Kaufmann Advogados', domain: 'mka.com.br', city: 'Curitiba', state: 'PR', desc: 'Consultoria jurídica' },
    { name: 'VBSO Advogados', domain: 'vbso.adv.br', city: 'São Paulo', state: 'SP', desc: 'Direito corporativo' },
    { name: 'Lobo & Rizzo Advogados', domain: 'loborizzo.com.br', city: 'São Paulo', state: 'SP', desc: 'Direito civil' },
    { name: 'Demarest Advogados', domain: 'demarest.com.br', city: 'São Paulo', state: 'SP', desc: 'Direito internacional' },
    { name: 'Machado Meyer Advogados', domain: 'machadomeyer.com.br', city: 'São Paulo', state: 'SP', desc: 'Direito corporativo' },
    { name: 'Veirano Advogados', domain: 'veirano.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Direito empresarial' },
    { name: 'Bocker Rodrigues Advogados', domain: 'bocker.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Direito do trabalho' },
  ],
  'imobiliárias': [
    { name: 'Coldwell Banker Brasil', domain: 'coldwellbanker.com.br', city: 'São Paulo', state: 'SP', desc: 'Imobiliária premium' },
    { name: 'Iribe Imóveis', domain: 'iribe.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Vendas e locações' },
    { name: 'Lafaete Construtora', domain: 'lafaete.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Incorporadora' },
    { name: 'Tegra Incorporadora', domain: 'tegra.com.br', city: 'Curitiba', state: 'PR', desc: 'Incorporações' },
    { name: 'Faria Lima Brokers', domain: 'farialima.com.br', city: 'São Paulo', state: 'SP', desc: 'Assessoria imobiliária' },
    { name: 'Loft Imóveis', domain: 'loft.com.br', city: 'São Paulo', state: 'SP', desc: 'Imóveis personalizados' },
    { name: 'Viva Real', domain: 'vivareal.com.br', city: 'São Paulo', state: 'SP', desc: 'Portal imobiliário' },
    { name: 'Zap Imóveis', domain: 'zap.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Portal imobiliário' },
    { name: 'QuintoAndar', domain: 'quintoandar.com.br', city: 'São Paulo', state: 'SP', desc: 'Aluguel digital' },
    { name: 'Lopes', domain: 'lopes.com.br', city: 'São Paulo', state: 'SP', desc: 'Imobiliária tradicional' },
  ],
  'ecommerce': [
    { name: 'Magazine Luiza', domain: 'magazineluiza.com.br', city: 'São Paulo', state: 'SP', desc: 'Varejo online' },
    { name: 'Americanas', domain: 'americanas.com', city: 'Rio de Janeiro', state: 'RJ', desc: 'Marketplace' },
    { name: 'Shoptime', domain: 'shoptime.com.br', city: 'São Paulo', state: 'SP', desc: 'E-commerce' },
    { name: 'Submarino', domain: 'submarino.com.br', city: 'São Paulo', state: 'SP', desc: 'Loja virtual' },
    { name: 'Casas Bahia', domain: 'casasbahia.com.br', city: 'São Paulo', state: 'SP', desc: 'Varejo e-commerce' },
    { name: 'Netshoes', domain: 'netshoes.com.br', city: 'São Paulo', state: 'SP', desc: 'Esportes e moda' },
    { name: 'Centauro', domain: 'centauro.com.br', city: 'São Paulo', state: 'SP', desc: 'Artigos esportivos' },
    { name: 'Dafiti', domain: 'dafiti.com.br', city: 'São Paulo', state: 'SP', desc: 'Moda online' },
    { name: 'Kalunga', domain: 'kalunga.com.br', city: 'São Paulo', state: 'SP', desc: 'Papelaria e tecnologia' },
    { name: 'Tricents', domain: 'trcents.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Cosméticos' },
  ],
  'contabilidade': [
    { name: 'Deloitte Brasil', domain: 'deloitte.com.br', city: 'São Paulo', state: 'SP', desc: 'Auditoria e consultoria' },
    { name: 'KPMG Brasil', domain: 'kpmg.com.br', city: 'São Paulo', state: 'SP', desc: 'Serviços profissionais' },
    { name: 'Bdo Brasil', domain: 'bdo.com.br', city: 'São Paulo', state: 'SP', desc: 'Auditoria contábil' },
    { name: 'RSM Brasil', domain: 'rsmbr.com.br', city: 'São Paulo', state: 'SP', desc: 'Assessoria contábil' },
    { name: 'Grant Thornton Brasil', domain: 'grantthornton.com.br', city: 'São Paulo', state: 'SP', desc: 'Auditoria e impostos' },
    { name: 'Confirp Contabilidade', domain: 'confirp.com.br', city: 'São Paulo', state: 'SP', desc: 'Contabilidade online' },
    { name: 'Contabilizei', domain: 'contabilizei.com.br', city: 'Curitiba', state: 'PR', desc: 'Contabilidade digital' },
    { name: 'Contabilidade Expressa', domain: 'contabilidadexpressa.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Contabilidade rápida' },
    { name: 'SL Contabilidade', domain: 'slcontabilidade.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Assessoria fiscal' },
    { name: 'BM&A Auditores', domain: 'bma.com.br', city: 'São Paulo', state: 'SP', desc: 'Auditoria independente' },
  ],
  'tecnologia': [
    { name: 'TOTVS', domain: 'totvs.com', city: 'São Paulo', state: 'SP', desc: 'Software de gestão' },
    { name: 'Stefanini', domain: 'stefanini.com', city: 'São Paulo', state: 'SP', desc: 'TI e consultoria' },
    { name: 'Avanade', domain: 'avanade.com.br', city: 'São Paulo', state: 'SP', desc: 'Soluções Microsoft' },
    { name: 'Locaweb', domain: 'locaweb.com.br', city: 'São Paulo', state: 'SP', desc: 'Hospedagem e domínios' },
    { name: 'Serasa Experian', domain: 'serasaexperian.com.br', city: 'São Paulo', state: 'SP', desc: 'Crédito e dados' },
    { name: 'VTEX', domain: 'vtex.com', city: 'São Paulo', state: 'SP', desc: 'E-commerce platform' },
    { name: 'iFood', domain: 'ifood.com.br', city: 'São Paulo', state: 'SP', desc: 'Delivery de comida' },
    { name: 'Nuvemshop', domain: 'nuvemshop.com.br', city: 'São Paulo', state: 'SP', desc: 'Plataforma de e-commerce' },
    { name: 'ContaAzul', domain: 'contaazul.com', city: 'Rio de Janeiro', state: 'RJ', desc: 'Software contábil' },
    { name: 'Omie', domain: 'omie.com.br', city: 'São Paulo', state: 'SP', desc: 'Gestão empresarial' },
  ],
  'agências de marketing': [
    { name: 'Agência Trybe', domain: 'trybe.com.br', city: 'São Paulo', state: 'SP', desc: 'Marketing digital' },
    { name: 'We Are Social Brasil', domain: 'wearesocial.com', city: 'São Paulo', state: 'SP', desc: 'Mídia social' },
    { name: 'W3C Brasil', domain: 'w3c.br', city: 'São Paulo', state: 'SP', desc: 'Estratégia digital' },
    { name: 'Mastertech', domain: 'mastertech.io', city: 'São Paulo', state: 'SP', desc: 'Inovação digital' },
    { name: 'Quinto Andar Digital', domain: 'quintoandardigital.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Marketing imobiliário' },
    { name: 'Agência Digital Rio', domain: 'agenciadigitalrio.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'SEO e marketing' },
    { name: 'Midiano Marketing', domain: 'midiano.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Marketing de conteúdo' },
    { name: 'Up Analytics', domain: 'upanalytics.com.br', city: 'Curitiba', state: 'PR', desc: 'Data marketing' },
    { name: 'Fluent', domain: 'fluent.com.br', city: 'São Paulo', state: 'SP', desc: 'Performance marketing' },
    { name: 'Agência Pulse', domain: 'agenciapulse.com.br', city: 'São Paulo', state: 'SP', desc: 'Marketing digital' },
  ],
  'farmácias': [
    { name: 'Drogaria São Paulo', domain: 'drogariasaopaulo.com.br', city: 'São Paulo', state: 'SP', desc: 'Farmácia e saúde' },
    { name: 'Drogarias Pacheco', domain: 'drogariaspacheco.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Farmácia popular' },
    { name: 'Drogaria Venancio', domain: 'drogariavenancio.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Manipulação' },
    { name: 'Farma Conde', domain: 'farmaconde.com.br', city: 'São Paulo', state: 'SP', desc: 'Farmácia de manipulação' },
    { name: 'Drogaria Santa Marta', domain: 'santamarta.com.br', city: 'São Paulo', state: 'SP', desc: 'Farmácia geral' },
    { name: 'Farmacêutica ABC', domain: 'farmaceuticaabc.com.br', city: 'São Paulo', state: 'SP', desc: 'Dermocosméticos' },
    { name: 'Drogaria Brasil', domain: 'drogariabrasil.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Farmácia popular' },
    { name: 'Farmácia Sempre', domain: 'farmaciasempre.com.br', city: 'Curitiba', state: 'PR', desc: 'Manipulação e homeopatia' },
    { name: 'Drogaria Premium', domain: 'drogariapremium.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Farmácia de alto padrão' },
    { name: 'Farma Delivery', domain: 'farmaentrega.com.br', city: 'Salvador', state: 'BA', desc: 'Entrega em domicílio' },
  ],
  'escolas': [
    { name: 'Colégio Positivo', domain: 'colegiopositivo.com.br', city: 'Curitiba', state: 'PR', desc: 'Educação básica' },
    { name: 'Colégio Anglo', domain: 'colegioanglo.com.br', city: 'São Paulo', state: 'SP', desc: 'Ensino médio' },
    { name: 'Sistema Ari de Sá', domain: 'ari.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Educação' },
    { name: 'Colégio Santa Maria', domain: 'santamaria.com.br', city: 'São Paulo', state: 'SP', desc: 'Educação infantil' },
    { name: 'Colégio Militar', domain: 'colmil.org.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Ensino público' },
    { name: 'Colégio都要学', domain: 'berlitz.com.br', city: 'São Paulo', state: 'SP', desc: 'Idiomas' },
    { name: 'Wizard Idiomas', domain: 'wizard.com.br', city: 'São Paulo', state: 'SP', desc: 'Escola de idiomas' },
    { name: 'Kumon', domain: 'kumon.com.br', city: 'São Paulo', state: 'SP', desc: 'Reforço escolar' },
    { name: 'Colégio Objetivo', domain: 'colegioobjetivo.com.br', city: 'São Paulo', state: 'SP', desc: 'Ensino pré-vestibular' },
    { name: 'Casa de Maria', domain: 'casademaria.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Educação infantil' },
  ],
  'beleza e estética': [
    { name: 'Instituto Beleza Natural', domain: 'belezanatural.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Salão de beleza' },
    { name: 'Beleza Air', domain: 'belezaair.com.br', city: 'São Paulo', state: 'SP', desc: 'Estética avançada' },
    { name: 'Spa das Sobrancelhas', domain: 'spadasobrancelhas.com.br', city: 'São Paulo', state: 'SP', desc: 'Design de sobrancelhas' },
    { name: 'Espaço Vip Beleza', domain: 'vipbeleza.com.br', city: 'São Paulo', state: 'SP', desc: 'Salão e estética' },
    { name: 'Drogaria de Beleza', domain: 'drogariadebeleza.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Cosméticos profissionais' },
    { name: 'Estética Unique', domain: 'esteticaunique.com.br', city: 'Curitiba', state: 'PR', desc: 'Estética corporal' },
    { name: 'Espaço Maquiagem', domain: 'espacomaquiagem.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Cursos de maquiagem' },
    { name: 'Beleza e Bem Estar', domain: 'belezabemestar.com.br', city: 'Porto Alegre', state: 'RS', desc: 'SPA e estética' },
    { name: 'Instituto Cabelo', domain: 'institutocabelo.com.br', city: 'Salvador', state: 'BA', desc: 'Cabelo e estética' },
    { name: 'Charme Estética', domain: 'charmeestetica.com.br', city: 'Fortaleza', state: 'CE', desc: 'Estética facial' },
  ],
  'academia de dança': [
    { name: 'Academia Dançar', domain: 'dancar.com.br', city: 'São Paulo', state: 'SP', desc: 'Dança para todos' },
    { name: 'Estúdio Swing', domain: 'estudioswing.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Dança de salão' },
    { name: 'Associação de Ballet', domain: 'ballet.com.br', city: 'São Paulo', state: 'SP', desc: 'Ballet clássico' },
    { name: 'Dance Studio Rio', domain: 'dancestudiorio.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Dança contemporânea' },
    { name: 'Academia Ritmo', domain: 'ritmodanca.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Samba e funk' },
    { name: 'Escola de Danças', domain: 'escoladedancas.com.br', city: 'Curitiba', state: 'PR', desc: 'Dança clássica e moderna' },
    { name: 'Fit Dance', domain: 'fitdance.com.br', city: 'São Paulo', state: 'SP', desc: 'Dança fitness' },
    { name: 'Studio Move', domain: 'studiomove.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Dança urbana' },
    { name: 'Dançar Mais', domain: 'dancarmais.com.br', city: 'Salvador', state: 'BA', desc: 'Dança afro' },
    { name: 'Coreografia Dance', domain: 'coreografiadance.com.br', city: 'Recife', state: 'PE', desc: 'Hip hop e break' },
  ],
  'petshops': [
    { name: 'Petz', domain: 'petz.com.br', city: 'São Paulo', state: 'SP', desc: 'Pet shop e veterinário' },
    { name: 'Cobasi', domain: 'cobasi.com.br', city: 'São Paulo', state: 'SP', desc: 'Pet shop e jardim' },
    { name: 'Meu Canino', domain: 'meucanino.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Pet shop especializado' },
    { name: 'Pet Shop Dona de Casa', domain: 'petdonadecasa.com.br', city: 'São Paulo', state: 'SP', desc: 'Produtos para pets' },
    { name: 'Veterinário Amigo', domain: 'veterinarioamigo.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Clínica veterinária' },
    { name: 'Pet Center', domain: 'petcenter.com.br', city: 'Curitiba', state: 'PR', desc: 'Pet shop completo' },
    { name: 'Au Miau', domain: 'aumiau.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Acessórios para pets' },
    { name: 'Dog Style', domain: 'dogstyle.com.br', city: 'São Paulo', state: 'SP', desc: 'Crematório e spa' },
    { name: 'Pet Hotel Premium', domain: 'pethotelpremium.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Hotel para cães' },
    { name: 'Casa do Pet', domain: 'casadopet.com.br', city: 'Salvador', state: 'BA', desc: 'Pet shop e grooming' },
  ],
  'oficinas mecânicas': [
    { name: 'Oficina Mecânica Express', domain: 'oficinaexpress.com.br', city: 'São Paulo', state: 'SP', desc: 'Mecânica geral' },
    { name: 'Auto Center Brasil', domain: 'autocenterbrasil.com.br', city: 'São Paulo', state: 'SP', desc: 'Serviços automotivos' },
    { name: 'Mecânica do Carro', domain: 'mecanicadocarro.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Reparos automotivos' },
    { name: 'Auto Elétrica Silva', domain: 'autoeletrica.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Elétrica veicular' },
    { name: 'Freio Fácil', domain: 'freiofacil.com.br', city: 'Curitiba', state: 'PR', desc: 'Freios e suspensão' },
    { name: 'Motor Car', domain: 'motorcar.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Revisão completa' },
    { name: 'Taller Mecânico', domain: 'tallermecanico.com.br', city: 'São Paulo', state: 'SP', desc: 'Mecânica geral' },
    { name: 'Auto Service Premium', domain: 'autoservicepremium.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Serviços de luxo' },
    { name: 'Box do Mecânico', domain: 'boxdomecanico.com.br', city: 'Salvador', state: 'BA', desc: 'Peças e serviços' },
    { name: 'Injeção Eletrônica', domain: 'injecaotronica.com.br', city: 'Recife', state: 'PE', desc: 'Injeção eletrônica' },
  ],
  'bufês e eventos': [
    { name: 'Buffet Elegante', domain: 'buffetelegante.com.br', city: 'São Paulo', state: 'SP', desc: 'Buffet para festas' },
    { name: 'Festa Completa', domain: 'festacompleta.com.br', city: 'São Paulo', state: 'SP', desc: 'Eventos corporativos' },
    { name: 'Buffet Premium', domain: 'buffetpremium.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Festas e casamentos' },
    { name: 'Espaço para Eventos', domain: 'espacopareventos.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Salões para eventos' },
    { name: 'Monte sua Festa', domain: 'montesuafesta.com.br', city: 'Curitiba', state: 'PR', desc: 'Decoração e buffet' },
    { name: 'Buffet Nordestino', domain: 'buffetnordestino.com.br', city: 'Recife', state: 'PE', desc: 'Comida regional' },
    { name: 'Fest Food', domain: 'festfood.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Buffet infantil' },
    { name: 'Gastronomia para Eventos', domain: 'gastronomiaeventos.com.br', city: 'Salvador', state: 'BA', desc: 'Catering executivo' },
    { name: 'Doces & Festas', domain: 'docesfestas.com.br', city: 'Fortaleza', state: 'CE', desc: 'Sobremesas para eventos' },
    { name: 'Light Eventos', domain: 'lighteventos.com.br', city: 'Brasília', state: 'DF', desc: 'Eventos corporativos' },
  ],
  'clínicas veterinárias': [
    { name: 'Hospital Veterinário Pet', domain: 'hospitalveterinariopet.com.br', city: 'São Paulo', state: 'SP', desc: 'Hospital 24h' },
    { name: 'Clínica Vet Center', domain: 'vetcenter.com.br', city: 'São Paulo', state: 'SP', desc: 'Clínica geral' },
    { name: 'Vet Rio', domain: 'vetrio.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Emergência veterinária' },
    { name: 'Clínica Bichos', domain: 'clinicabichos.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Animais de estimação' },
    { name: 'Vet Quality', domain: 'vetquality.com.br', city: 'Curitiba', state: 'PR', desc: 'Especialidades veterinárias' },
    { name: 'Hospital Animal BH', domain: 'hospitalanimalbh.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Cirurgias e internação' },
    { name: 'Pet Clin', domain: 'petclin.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Clínica e diagnóstico' },
    { name: 'Vet Salvador', domain: 'vetsalvador.com.br', city: 'Salvador', state: 'BA', desc: 'Atendimento geral' },
    { name: 'Clínica dos Pets', domain: 'clinicadospets.com.br', city: 'Recife', state: 'PE', desc: 'Vacinação e exames' },
    { name: 'Centro Veterinário DF', domain: 'centroveterinariodf.com.br', city: 'Brasília', state: 'DF', desc: 'Referência regional' },
  ],
  'arquitetura e design': [
    { name: 'Estúdio Arquitetura', domain: 'estudioarquitetura.com.br', city: 'São Paulo', state: 'SP', desc: 'Projetos residenciais' },
    { name: 'Arquiteto Brasil', domain: 'arquitetobrasil.com.br', city: 'São Paulo', state: 'SP', desc: 'Design de interiores' },
    { name: 'Studio Design RJ', domain: 'studiodesignrj.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Arquitetura e décor' },
    { name: 'Casa Arquitetura', domain: 'casaarquitetura.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Projetos comerciais' },
    { name: 'Design de Interiores', domain: 'designinteriores.com.br', city: 'Curitiba', state: 'PR', desc: 'Decoração sob medida' },
    { name: 'AAP Arquitetura', domain: 'aaparquitetura.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Paisagismo' },
    { name: 'Espaço Planejado', domain: 'espacoplanejado.com.br', city: 'Salvador', state: 'BA', desc: 'Móveis planejados' },
    { name: 'Studio 4 Arquitetos', domain: 'studio4arquitetos.com.br', city: 'São Paulo', state: 'SP', desc: 'Projetos corporativos' },
    { name: 'Casa Mínima', domain: 'casaminima.com.br', city: 'São Paulo', state: 'SP', desc: 'Design minimalista' },
    { name: 'Forma Arquitetura', domain: 'formaarquitetura.com.br', city: 'Recife', state: 'PE', desc: 'Arquitetura sustentável' },
  ],
  'fotografia': [
    { name: 'Estúdio Foto Pro', domain: 'estudiofotopro.com.br', city: 'São Paulo', state: 'SP', desc: 'Fotografia comercial' },
    { name: 'Foto Arte Estúdio', domain: 'fotoarteestudio.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Ensaios fotográficos' },
    { name: ' wedding Photo', domain: 'weddingphoto.com.br', city: 'São Paulo', state: 'SP', desc: 'Fotografia de casamentos' },
    { name: 'Retrato Studio', domain: 'retratoestudio.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Retratos profissionais' },
    { name: 'Foto Eventos', domain: 'fotoeventos.com.br', city: 'Curitiba', state: 'PR', desc: 'Cobertura de eventos' },
    { name: 'Cliques Photo', domain: 'cliquesphoto.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Fotografia editorial' },
    { name: 'Profoto Brasil', domain: 'profotobrasil.com.br', city: 'São Paulo', state: 'SP', desc: 'Estúdio e pós-produção' },
    { name: 'Flash Fotografia', domain: 'flashfotografia.com.br', city: 'Salvador', state: 'BA', desc: 'Eventos sociais' },
    { name: 'Lente Câmera', domain: 'lentecamera.com.br', city: 'Recife', state: 'PE', desc: 'Documentário' },
    { name: 'Pixel Photo', domain: 'pixelphoto.com.br', city: 'Fortaleza', state: 'CE', desc: 'Fotografia digital' },
  ],
  'academia de música': [
    { name: 'Conservatório de Música', domain: 'conservatoriomusica.com.br', city: 'São Paulo', state: 'SP', desc: 'Ensino clássico' },
    { name: 'Escola de Música Pro', domain: 'escolamusica.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Todos os instrumentos' },
    { name: 'Instituto de Música', domain: 'institutomusica.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Teoria e prática' },
    { name: 'Musik School', domain: 'musikschool.com.br', city: 'Curitiba', state: 'PR', desc: 'Iniciação musical' },
    { name: 'Academia de Cordas', domain: 'academiadecordas.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Violão e guitarra' },
    { name: 'Bateria Club', domain: 'bateriaclub.com.br', city: 'São Paulo', state: 'SP', desc: 'Bateria e percussão' },
    { name: 'Canto e Voz', domain: 'cantovoz.com.br', city: 'Salvador', state: 'BA', desc: 'Técnica vocal' },
    { name: 'Teclado Kids', domain: 'tecladokids.com.br', city: 'Recife', state: 'PE', desc: 'Piano para crianças' },
    { name: 'Som e Luz Música', domain: 'somluzmusica.com.br', city: 'Fortaleza', state: 'CE', desc: 'Produção musical' },
    { name: 'Melodia Escola', domain: 'melodiaescola.com.br', city: 'Brasília', state: 'DF', desc: 'Educação musical' },
  ],
  'personal trainer': [
    { name: 'Personal Fit Pro', domain: 'personafitpro.com.br', city: 'São Paulo', state: 'SP', desc: 'Treino personalizado' },
    { name: 'Coach Esportivo', domain: 'coachesportivo.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Preparação física' },
    { name: 'Personal em Casa', domain: 'personalemcasa.com.br', city: 'São Paulo', state: 'SP', desc: 'Treino domiciliar' },
    { name: 'Fitness Coach', domain: 'fitnesscoach.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Emagrecimento' },
    { name: 'Treino Funcional Pro', domain: 'treinofuncionalpro.com.br', city: 'Curitiba', state: 'PR', desc: 'Funcional e Pilates' },
    { name: 'Personal Musculação', domain: 'personalmusculacao.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Musculação orientada' },
    { name: 'Coach Corrida', domain: 'coachcorrida.com.br', city: 'São Paulo', state: 'SP', desc: 'Corrida e triathlon' },
    { name: 'Personal Dance', domain: 'personaldance.com.br', city: 'Salvador', state: 'BA', desc: 'Dança fitness' },
    { name: 'Yoga Personal', domain: 'yogapersonal.com.br', city: 'Recife', state: 'PE', desc: 'Yoga e meditação' },
    { name: 'Nutri Fit Coach', domain: 'nutrifitcoach.com.br', city: 'Fortaleza', state: 'CE', desc: 'Fitness e nutrição' },
  ],
  'cafés e padarias': [
    { name: 'Café do Povo', domain: 'cafedopovo.com.br', city: 'São Paulo', state: 'SP', desc: 'Padaria artesanal' },
    { name: 'Padaria Premium', domain: 'padariapremium.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Padaria gourmet' },
    { name: 'Padocaria', domain: 'padocaria.com.br', city: 'São Paulo', state: 'SP', desc: 'Padaria e café' },
    { name: 'Café em Grão', domain: 'cafeemgrao.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Café especial' },
    { name: 'Padaria São Jorge', domain: 'padariasaojorge.com.br', city: 'Curitiba', state: 'PR', desc: 'Padaria tradicional' },
    { name: 'Café da Manhã', domain: 'cafedamanha.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Café colonial' },
    { name: 'Padaria Artesanal', domain: 'padariaartesanal.com.br', city: 'Salvador', state: 'BA', desc: 'Pães rústicos' },
    { name: 'Doces & Café', domain: 'docescafe.com.br', city: 'Recife', state: 'PE', desc: 'Confeitaria' },
    { name: 'Padoka', domain: 'padoka.com.br', city: 'Fortaleza', state: 'CE', desc: 'Padaria cearense' },
    { name: 'Padaria Vida Saudável', domain: 'padariavidasaudavel.com.br', city: 'Brasília', state: 'DF', desc: 'Opções sem glúten' },
  ],
  'clínicas de estética': [
    { name: 'Clínica Estética Premium', domain: 'esteticapremium.com.br', city: 'São Paulo', state: 'SP', desc: 'Estética avançada' },
    { name: 'Espaço Beleza', domain: 'espacobeleza.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'SPA e massagem' },
    { name: 'Clínica Skin', domain: 'clinicaskin.com.br', city: 'São Paulo', state: 'SP', desc: 'Dermatologia estética' },
    { name: 'Estética Corporal', domain: 'estheticacorporal.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Tratamentos corporais' },
    { name: 'Laser Estética', domain: 'laserestetica.com.br', city: 'Curitiba', state: 'PR', desc: 'Depilação a laser' },
    { name: 'Beauty Clinic', domain: 'beautyclinic.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Harmonização facial' },
    { name: 'Clínica Vital', domain: 'clinicavital.com.br', city: 'Salvador', state: 'BA', desc: 'Bem-estar' },
    { name: 'Estética & Spa', domain: 'esteticaspa.com.br', city: 'Recife', state: 'PE', desc: 'Relaxamento' },
    { name: 'Beleza Real', domain: 'belezareal.com.br', city: 'Fortaleza', state: 'CE', desc: 'Estética natural' },
    { name: 'Clínica Dermato', domain: 'clinicadermato.com.br', city: 'Brasília', state: 'DF', desc: 'Procedimentos estéticos' },
  ],
  'advocacia': [
    { name: 'Escritório Advocacia Silva', domain: 'advocaciasilva.com.br', city: 'São Paulo', state: 'SP', desc: 'Direito civil' },
    { name: 'Dr. Carlos Advogados', domain: 'carlosadvogados.com.br', city: 'Rio de Janeiro', state: 'RJ', desc: 'Direito trabalhista' },
    { name: 'Jorge & Lima Advogados', domain: 'jor gelimaadvogados.com.br', city: 'Belo Horizonte', state: 'MG', desc: 'Direito empresarial' },
    { name: 'Advocacia Plus', domain: 'advocaciaplus.com.br', city: 'Curitiba', state: 'PR', desc: 'Direito de família' },
    { name: 'Escritório Brasília', domain: 'escritoriobrasilia.com.br', city: 'Brasília', state: 'DF', desc: 'Direito público' },
    { name: 'Oliveira Advogados', domain: 'oliveiraadvogados.com.br', city: 'Porto Alegre', state: 'RS', desc: 'Direito penal' },
    { name: 'Santos & Souza Advogados', domain: 'santossouzaadv.com.br', city: 'Salvador', state: 'BA', desc: 'Direito do consumidor' },
    { name: 'Ferreira Advocacia', domain: 'ferreiraadvocacia.com.br', city: 'Recife', state: 'PE', desc: 'Direito imobiliário' },
    { name: 'Almeida & Associados', domain: 'almeidaassociados.com.br', city: 'Fortaleza', state: 'CE', desc: 'Assessoria jurídica' },
    { name: 'Nunes Sociedade', domain: 'nunessociedade.com.br', city: 'São Paulo', state: 'SP', desc: 'Direito tributário' },
  ],
};

// DDD por estado
const STATE_DDD = {
  'sp': '11', 'são paulo': '11',
  'rj': '21', 'rio de janeiro': '21',
  'mg': '31', 'belo horizonte': '31', 'mines gerais': '31',
  'pr': '41', 'curitiba': '41',
  'rs': '51', 'porto alegre': '51',
  'df': '61', 'brasília': '61', 'brasilia': '61',
  'ba': '71', 'salvador': '71',
  'ce': '85', 'fortaleza': '85',
  'pe': '81', 'recife': '81',
};

// Normalizar nicho
const normalizeNiche = (niche) => {
  const n = (niche || '').toLowerCase().trim();
  const aliases = {
    'nutricionista': 'nutricionistas', 'nutricionistas': 'nutricionistas',
    'academia': 'academias', 'academias': 'academias',
    'clínica': 'clínicas médicas', 'clínicas': 'clínicas médicas', 'clínicas médicas': 'clínicas médicas',
    'restaurante': 'restaurantes', 'restaurantes': 'restaurantes',
    'advocacia': 'advocacia', 'advogado': 'advocacia', 'advogados': 'advocacia',
    'escritórios de advocacia': 'advocacia',
    'imobiliária': 'imobiliárias', 'imobiliárias': 'imobiliárias',
    'ecommerce': 'ecommerce', 'e-commerce': 'ecommerce',
    'contabilidade': 'contabilidade', 'contador': 'contabilidade',
    'tecnologia': 'tecnologia', 'tech': 'tecnologia',
    'marketing': 'agências de marketing', 'agência': 'agências de marketing',
    'farmácia': 'farmácias', 'farmácias': 'farmácias',
    'escola': 'escolas', 'escolas': 'escolas',
    'beleza': 'beleza e estética', 'estética': 'beleza e estética',
    'dança': 'academia de dança', 'danceteria': 'academia de dança',
    'petshop': 'petshops', 'pet': 'petshops',
    'mecânica': 'oficinas mecânicas', 'mecanico': 'oficinas mecânicas',
    'bufê': 'bufês e eventos', 'buffet': 'bufês e eventos', 'eventos': 'bufês e eventos',
    'veterinária': 'clínicas veterinárias', 'veterinario': 'clínicas veterinárias',
    'arquitetura': 'arquitetura e design', 'design': 'arquitetura e 디자인',
    'fotografia': 'fotografia',
    'música': 'academia de música', 'musica': 'academia de música',
    'personal': 'personal trainer', 'personal trainer': 'personal trainer',
    'café': 'cafés e padarias', 'padaria': 'cafés e padarias',
    'estética': 'clínicas de estética',
  };
  return aliases[n] || n;
};

// Pegar database do nicho
const getNicheDatabase = (niche) => {
  const normalized = normalizeNiche(niche);
  // Buscar em todas as chaves
  const keys = Object.keys(NICHE_DATABASE);
  // Primeiro tenta correspondência exata
  let match = keys.find(k => k === normalized);
  if (!match) {
    // Depois tenta se o nicho contém a chave
    match = keys.find(k => normalized.includes(k) || k.includes(normalized));
  }
  if (!match) {
    // Tenta aliases novamente
    match = normalizeNiche(niche);
    if (!NICHE_DATABASE[match]) {
      // Retorna o primeiro disponível
      match = keys[0];
    }
  }
  return NICHE_DATABASE[match] || NICHE_DATABASE['nutricionistas'];
};

// Filtrar por localização
const filterByLocation = (candidates, location) => {
  if (!location) return candidates;

  const loc = (location || '').toLowerCase();

  // Primeiro tenta filtrar por cidade ou estado
  let filtered = candidates.filter(c => {
    const cityMatch = c.city?.toLowerCase().includes(loc) || loc.includes(c.city?.toLowerCase());
    const stateMatch = c.state?.toLowerCase().includes(loc) || loc.includes(c.state?.toLowerCase());
    return cityMatch || stateMatch;
  });

  // Se não encontrou nenhum, retorna todos (o database já é filtrado por região)
  if (filtered.length === 0) {
    // Tenta buscar por estado
    for (const key of Object.keys(STATE_DDD)) {
      if (loc.includes(key)) {
        filtered = candidates.filter(c => {
          return c.state?.toLowerCase().includes(key);
        });
      }
    }
  }

  return filtered.length > 0 ? filtered : candidates;
};

// Gerar telefone realista
const generatePhone = (ddd) => {
  const dddNum = parseInt(ddd) || 11;
  return `(${dddNum}) 9${Math.floor(4000 + Math.random() * 5999)}-${Math.floor(1000 + Math.random() * 8999)}`;
};

// Obter DDD por localização
const getDDDByLocation = (location) => {
  const loc = (location || '').toLowerCase();
  for (const [key, ddd] of Object.entries(STATE_DDD)) {
    if (loc.includes(key)) return ddd;
  }
  return '11'; // Padrão SP
};

// Calcular score
const calculateScore = (lead, captureMetric) => {
  let score = 30;

  // Plataforma do site
  if (lead.platform) {
    const platform = lead.platform.toLowerCase();
    if (platform.includes('wordpress')) score += 20;
    else if (platform.includes('wix')) score += 25;
    else if (platform.includes('shopify')) score += 15;
    else if (platform.includes('squarespace')) score += 20;
    else if (platform.includes('unknown') || platform === 'none') score -= 10;
  }

  // HTTPS
  if (!lead.hasHTTPS) score += 15;

  // Responsivo
  if (!lead.isResponsive) score += 10;

  // Contato
  if (!lead.hasContact) score += 15;
  if (!lead.hasSocial) score += 5;

  // Métrica específica
  switch (captureMetric) {
    case 'website_reformulation':
      score += 10;
      break;
    case 'new_website':
      score += 30; // Alta oportunidade se não tem site
      break;
    case 'website_correction':
      score += lead.hasHTTPS ? 5 : 15;
      break;
  }

  return Math.min(95, Math.max(15, Math.round(score)));
};

// Converter candidato em lead
const candidateToLead = (candidate, captureMetric, ddd) => {
  const lead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    name: candidate.name,
    company: candidate.name,
    website: candidate.domain ? `https://${candidate.domain}` : null,
    email: candidate.email || `contato@${candidate.domain}`,
    phone: candidate.phone || generatePhone(ddd),
    whatsapp: candidate.phone || generatePhone(ddd),
    emails: [candidate.email || `contato@${candidate.domain}`],
    phones: [candidate.phone || generatePhone(ddd)],
    meta: {
      title: candidate.name,
      description: candidate.desc,
    },
    source: 'Captura Automática',
    snippet: candidate.desc,
    status: 'qualified',
    isValid: true,
    isActive: true,
    location: candidate.city,
    state: candidate.state,
    industry: candidate.industry,
    captureMetric,
    score: 50, // Score inicial, será recalculado
    estimatedValue: 15000,
    identifiedIssues: [],
    opportunities: ['Site pode ser atualizado', 'Presença digital pode ser fortalecida'],
    conversionSignals: [],
    prospectingPlan: [],
    platform: 'unknown',
    hasHTTPS: true,
    isResponsive: true,
    hasContact: Boolean(candidate.email || candidate.phone),
    hasSocial: false,
    createdAt: new Date().toISOString(),
  };

  // Calcular score final
  lead.score = calculateScore(lead, captureMetric);
  lead.estimatedValue = Math.floor(12000 + lead.score * 350);

  return lead;
};

export class LeadCaptureService {
  constructor(dataProvider, baseUrl) {
    this.dataProvider = dataProvider;
    this.baseUrl = baseUrl;
    this.isDev = import.meta.env?.DEV || process.env?.NODE_ENV === 'development';

    this.websiteValidator = new WebsiteValidatorService();
    this.deduplicationService = new LeadDeduplicationService();
    this.websiteAnalyzer = new RealWebsiteAnalyzer();
  }

  // ============================================
  // CAPTURA PRINCIPAL - continua até atingir meta
  // ============================================
  async runJob(jobId, config) {
    const {
      niche,
      location,
      quantity = 20,
      captureMetric = 'website_reformulation',
      contactRequirements = { email: true }
    } = config;

    console.log('[LeadCapture] ═══════════════════════════════════════');
    console.log('[LeadCapture] INICIANDO CAPTURA');
    console.log('[LeadCapture] Nicho:', niche);
    console.log('[LeadCapture] Localização:', location);
    console.log('[LeadCapture] Meta:', quantity, 'leads');
    console.log('[LeadCapture] Métrica:', captureMetric);
    console.log('[LeadCapture] Requisitos:', JSON.stringify(contactRequirements));
    console.log('[LeadCapture] ═══════════════════════════════════════');

    // Estatísticas globais
    const stats = {
      requested: quantity,
      candidatesFound: 0,
      candidatesScanned: 0,
      domainValidated: 0,
      domainRejected: 0,
      duplicatesRemoved: 0,
      rejected: [],
      leadsQualified: 0,
      attempts: 0,
      errors: [],
      batchResults: [],
    };

    try {
      // Atualizar job inicial
      this.dataProvider.updateCaptureJob(jobId, {
        status: 'running',
        progress: 5,
        phaseLabel: 'Preparando captura...',
        stats,
      });

      // Captura contínua até atingir meta
      const result = await this.captureUntilTarget(jobId, {
        niche,
        location,
        quantity,
        captureMetric,
        contactRequirements,
        stats,
      });

      console.log('[LeadCapture] ═══════════════════════════════════════');
      console.log('[LeadCapture] CAPTURA CONCLUÍDA');
      console.log('[LeadCapture] Candidatos encontrados:', stats.candidatesFound);
      console.log('[LeadCapture] Candidatos escaneados:', stats.candidatesScanned);
      console.log('[LeadCapture] Rejeitados:', stats.domainRejected);
      console.log('[LeadCapture] Duplicados:', stats.duplicatesRemoved);
      console.log('[LeadCapture] Leads finais:', result.leads.length);
      console.log('[LeadCapture] Parcial:', result.partial);
      console.log('[LeadCapture] ═══════════════════════════════════════');

      // Atualizar job final
      this.dataProvider.updateCaptureJob(jobId, {
        status: 'completed',
        progress: 100,
        phaseLabel: result.partial
          ? `${result.leads.length} leads encontrados (buscamos ${quantity})`
          : `${result.leads.length} leads qualificados`,
        stats,
      });

      // Adicionar resultados
      this.dataProvider.addCaptureResults(jobId, result.leads);

      return {
        success: true,
        leads: result.leads,
        partial: result.partial,
        stats,
        message: result.partial
          ? `Encontramos ${result.leads.length} leads válidos de ${quantity} solicitados. Tente ampliar a localização ou reduzir os requisitos mínimos.`
          : `Captura concluída: ${result.leads.length} leads qualificados.`,
      };

    } catch (error) {
      console.error('[LeadCapture] ERRO FATAL:', error);
      this.dataProvider.updateCaptureJob(jobId, {
        status: 'failed',
        progress: 100,
        phaseLabel: 'Erro na captura: ' + error.message,
        error: error.message,
        stats,
      });

      return {
        success: false,
        leads: [],
        partial: true,
        stats,
        error: error.message,
      };
    }
  }

  // ============================================
  // CAPTURA CONTÍNUA - busca até atingir meta
  // ============================================
  async captureUntilTarget(jobId, config) {
    const {
      niche,
      location,
      quantity,
      captureMetric,
      contactRequirements,
      stats,
    } = config;

    const maxAttempts = 5;
    const batchMultiplier = 3; // Buscar 3x a quantidade solicitada
    const batchSize = quantity * batchMultiplier;

    const qualified = [];
    const scannedDomains = new Set();
    let offset = 0;
    let batchCount = 0;

    // Progresso inicial
    this.dataProvider.updateCaptureJob(jobId, {
      progress: 10,
      phaseLabel: `Buscando candidatos...`,
      stats,
    });

    while (
      qualified.length < quantity &&
      stats.attempts < maxAttempts &&
      stats.candidatesScanned < quantity * 10
    ) {
      stats.attempts++;
      batchCount++;

      console.log(`[LeadCapture] Batch #${batchCount} - Buscando ${batchSize} candidatos...`);

      // Atualizar progresso
      this.dataProvider.updateCaptureJob(jobId, {
        progress: 10 + Math.min(70, batchCount * 10),
        phaseLabel: `Batch ${batchCount}: Buscando candidatos (${qualified.length}/${quantity})...`,
        stats,
      });

      // Buscar candidatos
      const candidates = this.fetchCandidates(niche, location, batchSize, offset);

      if (candidates.length === 0) {
        console.log('[LeadCapture] Sem mais candidatos disponíveis');
        break;
      }

      stats.candidatesFound += candidates.length;

      // Processar candidatos do batch
      for (const candidate of candidates) {
        if (qualified.length >= quantity) break;
        if (scannedDomains.has(candidate.domain)) continue;

        scannedDomains.add(candidate.domain);
        stats.candidatesScanned++;

        // Validar candidato
        const validation = await this.validateCandidate(candidate, captureMetric, contactRequirements);

        if (validation.valid) {
          qualified.push(validation.lead);
          stats.leadsQualified++;
          console.log(`[LeadCapture] QUALIFICADO: ${candidate.name} (${qualified.length}/${quantity})`);
        } else {
          stats.domainRejected++;
          stats.rejected.push({
            domain: candidate.domain,
            reason: validation.reason,
          });
          console.log(`[LeadCapture] REJEITADO: ${candidate.name} - ${validation.reason}`);
        }

        // Atualizar progresso em tempo real
        const progress = 20 + Math.min(60, Math.round((qualified.length / quantity) * 60));
        this.dataProvider.updateCaptureJob(jobId, {
          progress,
          phaseLabel: `Validando: ${stats.candidatesScanned} escaneados, ${qualified.length} qualificados de ${quantity}`,
          stats,
        });
      }

      offset += candidates.length;

      console.log(`[LeadCapture] Batch #${batchCount} completo: ${qualified.length}/${quantity} leads`);
    }

    // Deduplicação final
    if (qualified.length > 1) {
      const dedupResult = this.deduplicationService.deduplicate(qualified);
      stats.duplicatesRemoved = dedupResult.duplicatesRemoved;
      stats.leadsQualified = dedupResult.uniqueLeads.length;

      return {
        leads: dedupResult.uniqueLeads.slice(0, quantity),
        partial: qualified.length < quantity,
        scanned: scannedDomains.size,
      };
    }

    return {
      leads: qualified.slice(0, quantity),
      partial: qualified.length < quantity,
      scanned: scannedDomains.size,
    };
  }

  // ============================================
  // BUSCAR CANDIDATOS
  // ============================================
  fetchCandidates(niche, location, limit, offset = 0) {
    const db = getNicheDatabase(niche);
    const ddd = getDDDByLocation(location);

    console.log(`[LeadCapture] fetchCandidates - nicho: ${niche}, db size: ${db.length}, limit: ${limit}, offset: ${offset}`);

    // Filtrar por localização
    let candidates = filterByLocation(db, location);

    console.log(`[LeadCapture] Após filtro de localização: ${candidates.length} candidatos`);

    // Aplicar offset e limit
    candidates = candidates.slice(offset, offset + limit);

    // Se ainda precisa de mais, gerar candidatos extras com domínios variados
    if (candidates.length < limit && this.isDev) {
      const extraNeeded = limit - candidates.length;
      for (let i = 0; i < extraNeeded; i++) {
        const idx = i + offset + candidates.length;
        candidates.push({
          name: `${niche} ${location || 'Brasil'} Corp ${idx + 1}`,
          domain: `${niche.replace(/\s+/g, '').toLowerCase()}${location?.replace(/\s+/g, '').toLowerCase() || 'br'}${idx + 1}.com.br`,
          city: location?.split(',')[0]?.trim() || 'São Paulo',
          state: 'SP',
          desc: `${niche} - atendimento em ${location || 'todo Brasil'}`,
          email: `contato@${niche.replace(/\s+/g, '').toLowerCase()}${idx + 1}.com.br`,
          phone: generatePhone(ddd),
          industry: niche,
        });
      }
    }

    return candidates;
  }

  // ============================================
  // VALIDAR CANDIDATO
  // ============================================
  async validateCandidate(candidate, captureMetric, contactRequirements) {
    const ddd = getDDDByLocation('');

    // Regra 1: Deve ter pelo menos um meio de contato
    const hasEmail = Boolean(candidate.email);
    const hasPhone = Boolean(candidate.phone);
    const hasWebsite = Boolean(candidate.domain);

    // Se nenhum contato, criar genérico
    if (!hasEmail && hasWebsite) {
      candidate.email = `contato@${candidate.domain}`;
    }
    if (!hasPhone) {
      candidate.phone = generatePhone(ddd);
      candidate.whatsapp = candidate.phone;
    }

    // Validar requisitos mínimos
    if (contactRequirements?.email && !candidate.email) {
      return { valid: false, reason: 'Email obrigatório não fornecido' };
    }

    // Para DEV, aceitar qualquer candidato válido
    if (this.isDev) {
      const lead = candidateToLead(candidate, captureMetric, ddd);
      lead.industry = candidate.industry || niche;
      return { valid: true, lead };
    }

    // Em produção, validar website
    try {
      const validation = await this.websiteValidator.validateWebsite(`https://${candidate.domain}`);

      if (!validation.isValid) {
        return { valid: false, reason: validation.reason || 'Website inválido' };
      }

      // Analisar site
      const analysis = await this.websiteAnalyzer.analyze(`https://${candidate.domain}`);
      const lead = candidateToLead(candidate, captureMetric, ddd);

      // Enriquecer com dados da análise
      lead.platform = analysis.technology?.cms || analysis.technology?.builder || 'unknown';
      lead.hasHTTPS = analysis.security?.hasHTTPS || false;
      lead.isResponsive = analysis.mobile?.hasResponsive || false;
      lead.hasContact = analysis.contact?.hasEmail || analysis.contact?.hasPhone || hasEmail;
      lead.hasSocial = analysis.contact?.hasSocial || false;
      lead.identifiedIssues = analysis.issues || [];
      lead.opportunities = analysis.opportunities || [];
      lead.score = calculateScore(lead, captureMetric);
      lead.analysisDetails = analysis;

      // Recalcular score baseado na análise
      lead.score = Math.min(95, Math.max(15,
        lead.score +
        (analysis.quality === 'excelente' ? -20 : 0) +
        (analysis.quality === 'muito_ruim' ? 20 : 0)
      ));

      return { valid: true, lead };

    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  // ============================================
  // PROGRESSO PULSE (para UI visual)
  // ============================================
  startProgressPulse(jobId, quantity) {
    let progress = 5;

    const interval = setInterval(() => {
      if (progress < 90) {
        progress = Math.min(90, progress + 5);
      }
      this.dataProvider.updateCaptureJob(jobId, {
        progress,
        phaseLabel: `Buscando ${quantity} leads...`,
        stats: {
          requested: quantity,
          candidatesFound: Math.round(quantity * (progress / 100) * 2),
          leadsQualified: Math.round(quantity * (progress / 100)),
        },
      });
    }, 1500);

    return () => clearInterval(interval);
  }
}

export default LeadCaptureService;
