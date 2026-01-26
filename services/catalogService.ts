import { supabaseService } from './supabaseService';
import { CatalogItem, CatalogFilter } from '../types/catalog';

const LOCAL_CATALOG_ITEMS: CatalogItem[] = [
    {
        id: 'local-001',
        title: 'Fundamentos de Programação (Lógica e Algoritmos)',
        description: 'Base sólida para iniciar em programação com exercícios práticos e resolução de problemas.',
        type: 'course',
        category: 'Programação',
        image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://developer.mozilla.org/pt-BR/docs/Learn',
        price: 'Gratuito',
        tags: ['iniciante', 'lógica', 'algoritmos'],
        featured: true,
        created_at: '2025-01-10T12:00:00Z'
    },
    {
        id: 'local-002',
        title: 'JavaScript Moderno para Web',
        description: 'Sintaxe moderna, DOM, fetch, async/await e padrões para projetos reais.',
        type: 'course',
        category: 'Programação',
        image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript',
        price: 'Gratuito',
        tags: ['javascript', 'web', 'frontend'],
        featured: true,
        created_at: '2025-01-12T12:00:00Z'
    },
    {
        id: 'local-003',
        title: 'TypeScript Essencial',
        description: 'Tipagem, interfaces, generics e boas práticas para crescer com segurança.',
        type: 'course',
        category: 'Programação',
        image_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://www.typescriptlang.org/docs/',
        price: 'Gratuito',
        tags: ['typescript', 'frontend', 'backend'],
        featured: false,
        created_at: '2025-01-15T12:00:00Z'
    },
    {
        id: 'local-004',
        title: 'Git e GitHub para o dia a dia',
        description: 'Branches, pull requests e fluxo de trabalho profissional para projetos.',
        type: 'course',
        category: 'Carreira',
        image_url: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://docs.github.com/pt',
        price: 'Gratuito',
        tags: ['git', 'github', 'colaboração'],
        featured: true,
        created_at: '2025-01-18T12:00:00Z'
    },
    {
        id: 'local-005',
        title: 'Introdução a Python para Automação',
        description: 'Scripts úteis, organização de projetos e automação de tarefas repetitivas.',
        type: 'course',
        category: 'Programação',
        image_url: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://docs.python.org/pt-br/3/tutorial/',
        price: 'Gratuito',
        tags: ['python', 'automação', 'iniciante'],
        featured: false,
        created_at: '2025-01-20T12:00:00Z'
    },
    {
        id: 'local-006',
        title: 'SQL para Análise de Dados',
        description: 'Consultas, joins, agregações e modelagem simples para análise.',
        type: 'course',
        category: 'Dados',
        image_url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://sqlbolt.com/',
        price: 'Gratuito',
        tags: ['sql', 'dados', 'postgres'],
        featured: true,
        created_at: '2025-01-22T12:00:00Z'
    },
    {
        id: 'local-007',
        title: 'Excel/Planilhas: do básico ao prático',
        description: 'Fórmulas, tabelas dinâmicas e organização para rotinas de dados.',
        type: 'course',
        category: 'Dados',
        image_url: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://support.microsoft.com/pt-br/excel',
        price: 'Gratuito',
        tags: ['planilhas', 'excel', 'produtividade'],
        featured: false,
        created_at: '2025-01-25T12:00:00Z'
    },
    {
        id: 'local-008',
        title: 'Fundamentos de Estatística para Dados',
        description: 'Conceitos essenciais para análises confiáveis e leitura de métricas.',
        type: 'book',
        category: 'Dados',
        image_url: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://www.openintro.org/book/os/',
        price: null,
        tags: ['estatística', 'métricas'],
        featured: false,
        created_at: '2025-02-01T12:00:00Z'
    },
    {
        id: 'local-009',
        title: 'Introdução a UX e Pesquisa com Usuários',
        description: 'Como estruturar entrevistas, testes e sintetizar insights acionáveis.',
        type: 'course',
        category: 'Design',
        image_url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://www.nngroup.com/articles/',
        price: 'Gratuito',
        tags: ['ux', 'pesquisa', 'produto'],
        featured: true,
        created_at: '2025-02-03T12:00:00Z'
    },
    {
        id: 'local-010',
        title: 'Design Systems: Guia Prático',
        description: 'Tokens, componentes e governança para consistência e escala.',
        type: 'book',
        category: 'Design',
        image_url: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://m3.material.io/',
        price: null,
        tags: ['design system', 'ui'],
        featured: false,
        created_at: '2025-02-05T12:00:00Z'
    },
    {
        id: 'local-011',
        title: 'Figma: Componentes e Protótipos',
        description: 'Auto-layout, variantes e prototipação para comunicação com stakeholders.',
        type: 'tool',
        category: 'Design',
        image_url: 'https://images.unsplash.com/photo-1618788372246-79faff0c3742?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://help.figma.com/hc/pt-br',
        price: 'Freemium',
        tags: ['figma', 'ui', 'protótipo'],
        featured: true,
        created_at: '2025-02-07T12:00:00Z'
    },
    {
        id: 'local-012',
        title: 'Acessibilidade na Web (WCAG na prática)',
        description: 'Contraste, semântica, teclado e padrões acessíveis para produtos digitais.',
        type: 'course',
        category: 'Design',
        image_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://developer.mozilla.org/pt-BR/docs/Web/Accessibility',
        price: 'Gratuito',
        tags: ['a11y', 'wcag', 'ux'],
        featured: false,
        created_at: '2025-02-10T12:00:00Z'
    },
    {
        id: 'local-013',
        title: 'Marketing Digital: Funil e Conteúdo',
        description: 'Posicionamento, funil, calendário editorial e métricas para decisões.',
        type: 'course',
        category: 'Marketing',
        image_url: 'https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://learndigital.withgoogle.com/atelierdigital',
        price: null,
        tags: ['marketing', 'conteúdo', 'funil'],
        featured: true,
        created_at: '2025-02-12T12:00:00Z'
    },
    {
        id: 'local-014',
        title: 'Google Analytics (base) e Métricas',
        description: 'Noções essenciais para acompanhar aquisição, engajamento e conversão.',
        type: 'tool',
        category: 'Marketing',
        image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://support.google.com/analytics',
        price: 'Gratuito',
        tags: ['analytics', 'métricas'],
        featured: false,
        created_at: '2025-02-15T12:00:00Z'
    },
    {
        id: 'local-015',
        title: 'LinkedIn: Perfil e Portfólio que converte',
        description: 'Estrutura de headline, resumo, projetos e networking sem spam.',
        type: 'course',
        category: 'Carreira',
        image_url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://www.linkedin.com/help/linkedin',
        price: null,
        tags: ['linkedin', 'portfólio', 'networking'],
        featured: true,
        created_at: '2025-02-20T12:00:00Z'
    },
    {
        id: 'local-016',
        title: 'Currículo ATS-Friendly (modelo e checklist)',
        description: 'Checklist para deixar o currículo legível para recrutamento e triagem.',
        type: 'tool',
        category: 'Carreira',
        image_url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://europa.eu/europass/en/create-europass-cv',
        price: 'Gratuito',
        tags: ['cv', 'ats', 'carreira'],
        featured: false,
        created_at: '2025-02-22T12:00:00Z'
    },
    {
        id: 'local-017',
        title: 'Entrevistas Técnicas: Treino de Perguntas',
        description: 'Como treinar, estruturar respostas e registrar aprendizados por vaga.',
        type: 'mentorship',
        category: 'Carreira',
        image_url: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://www.pramp.com/',
        price: null,
        tags: ['entrevista', 'prática'],
        featured: false,
        created_at: '2025-02-25T12:00:00Z'
    },
    {
        id: 'local-018',
        title: 'Introdução a APIs e Integrações',
        description: 'HTTP, REST, autenticação e consumo de APIs com exemplos práticos.',
        type: 'course',
        category: 'Programação',
        image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP',
        price: 'Gratuito',
        tags: ['api', 'http', 'backend'],
        featured: false,
        created_at: '2025-03-01T12:00:00Z'
    },
    {
        id: 'local-019',
        title: 'React: Componentes e Estado',
        description: 'Componentização, hooks e padrões para construir interfaces escaláveis.',
        type: 'course',
        category: 'Programação',
        image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://react.dev/learn',
        price: 'Gratuito',
        tags: ['react', 'frontend'],
        featured: true,
        created_at: '2025-03-03T12:00:00Z'
    },
    {
        id: 'local-020',
        title: 'Node.js: Fundamentos para Backend',
        description: 'Rotas, middleware e estruturação de API com boas práticas.',
        type: 'course',
        category: 'Programação',
        image_url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://nodejs.org/en/learn',
        price: 'Gratuito',
        tags: ['node', 'api', 'backend'],
        featured: false,
        created_at: '2025-03-05T12:00:00Z'
    },
    {
        id: 'local-021',
        title: 'Portfólio: Projetos de Dados (ideias)',
        description: 'Ideias de projetos para praticar SQL, dashboards e storytelling.',
        type: 'tool',
        category: 'Dados',
        image_url: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://www.kaggle.com/learn',
        price: 'Gratuito',
        tags: ['portfólio', 'dados'],
        featured: false,
        created_at: '2025-03-10T12:00:00Z'
    },
    {
        id: 'local-022',
        title: 'Power BI: Dashboards do zero',
        description: 'Modelagem, medidas e visualização para relatórios e storytelling.',
        type: 'tool',
        category: 'Dados',
        image_url: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://learn.microsoft.com/pt-br/power-bi/',
        price: 'Freemium',
        tags: ['power bi', 'dashboards'],
        featured: true,
        created_at: '2025-03-12T12:00:00Z'
    },
    {
        id: 'local-023',
        title: 'Copywriting: Texto para Conversão',
        description: 'Proposta de valor, páginas, e-mails e testes de mensagem.',
        type: 'course',
        category: 'Marketing',
        image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://academy.hubspot.com/courses/content-marketing',
        price: null,
        tags: ['copy', 'conversão'],
        featured: false,
        created_at: '2025-03-15T12:00:00Z'
    },
    {
        id: 'local-024',
        title: 'SEO Essencial (técnico + conteúdo)',
        description: 'Como estruturar páginas, pesquisa de palavras-chave e boas práticas.',
        type: 'course',
        category: 'Marketing',
        image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://developers.google.com/search/docs',
        price: 'Gratuito',
        tags: ['seo', 'conteúdo'],
        featured: false,
        created_at: '2025-03-18T12:00:00Z'
    },
    {
        id: 'local-025',
        title: 'Roadmap de Carreira: 30 dias de ação',
        description: 'Rotina simples com checkpoints para sair do zero e ganhar tração.',
        type: 'book',
        category: 'Carreira',
        image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://www.atlassian.com/blog/productivity/30-60-90-day-plan',
        price: null,
        tags: ['planejamento', 'rotina'],
        featured: false,
        created_at: '2025-03-20T12:00:00Z'
    },
    {
        id: 'local-026',
        title: 'Mentoria: Revisão de Currículo e LinkedIn',
        description: 'Sessão focada em clareza, impacto e alinhamento com a vaga-alvo.',
        type: 'mentorship',
        category: 'Carreira',
        image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://adplist.org/',
        price: null,
        tags: ['cv', 'linkedin', 'mentoria'],
        featured: true,
        created_at: '2025-03-22T12:00:00Z'
    },
    {
        id: 'local-027',
        title: 'Ferramentas de Produtividade para Estudos',
        description: 'Checklist de ferramentas e rotinas para estudar com consistência.',
        type: 'tool',
        category: 'Carreira',
        image_url: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://www.notion.so/templates',
        price: 'Gratuito',
        tags: ['produtividade', 'estudos'],
        featured: false,
        created_at: '2025-03-25T12:00:00Z'
    },
    {
        id: 'local-028',
        title: 'Design de Interfaces: Layout e Hierarquia',
        description: 'Princípios de tipografia, grid, espaçamento e consistência visual.',
        type: 'course',
        category: 'Design',
        image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://m3.material.io/foundations/layout/overview',
        price: null,
        tags: ['ui', 'layout'],
        featured: false,
        created_at: '2025-04-01T12:00:00Z'
    },
    {
        id: 'local-029',
        title: 'Case de Portfólio: Estrutura recomendada',
        description: 'Modelo de narrativa para apresentar problema, processo e resultados.',
        type: 'tool',
        category: 'Design',
        image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://www.behance.net/',
        price: 'Gratuito',
        tags: ['portfólio', 'case'],
        featured: false,
        created_at: '2025-04-03T12:00:00Z'
    },
    {
        id: 'local-030',
        title: 'Comunicação e Storytelling para Apresentações',
        description: 'Estruture ideias, conduza reuniões e apresente projetos com clareza.',
        type: 'course',
        category: 'Carreira',
        image_url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://www.duarte.com/presentation-skills-resources/',
        price: null,
        tags: ['comunicação', 'storytelling'],
        featured: false,
        created_at: '2025-04-05T12:00:00Z'
    },
    {
        id: 'local-031',
        title: 'Clean Code (Código Limpo) — Robert C. Martin',
        description: 'Um clássico sobre boas práticas, legibilidade e manutenção de código para profissionais de software.',
        type: 'book',
        category: 'Programação',
        image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://www.amazon.com.br/dp/8576082675',
        price: null,
        tags: ['livro', 'clean code', 'boas práticas', 'engenharia de software'],
        featured: true,
        created_at: '2025-04-07T12:00:00Z'
    },
    {
        id: 'local-032',
        title: 'Formação Java Full Stack: Lógica → Spring Boot → Angular → Cloud',
        description: 'Treinamento completo do zero ao profissional: lógica, algoritmos e OOP; Spring Boot REST API; Angular/TypeScript; PostgreSQL/SQL; JPA/Hibernate/Spring Data; Security; relatórios (Jasper) e deploy em cloud (Java 8 a 22).',
        type: 'course',
        category: 'Programação',
        image_url: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://go.hotmart.com/C103429094N',
        price: null,
        tags: ['java', 'spring boot', 'rest', 'angular', 'typescript', 'postgresql', 'jpa', 'hibernate', 'spring security', 'cloud'],
        featured: true,
        created_at: '2025-04-08T12:00:00Z'
    },
    {
        id: 'local-033',
        title: 'JetMaster: WordPress do Básico ao Avançado (sem programação)',
        description: 'Aprenda a criar sites de alto valor com WordPress, do básico ao avançado, usando as tecnologias mais atuais de “vibe coding” — e monetize criando portais, catálogos, áreas de membros, sites para clínicas, imobiliárias e muito mais.',
        type: 'course',
        category: 'Programação',
        image_url: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://go.hotmart.com/E103431399C',
        price: null,
        tags: ['wordpress', 'sites', 'freelancer', 'negócios', 'web', 'sem programação'],
        featured: true,
        created_at: '2025-04-09T12:00:00Z'
    },
    {
        id: 'local-034',
        title: 'Francês Definitivo: Imersão do Básico ao Avançado (A1 → B2)',
        description: 'Curso completo com +140 aulas 100% em francês (com legendas PT/FR), resumos em PDF, exercícios corrigidos e bônus de conversação em grupo. Ideal para sair do zero e dominar o idioma com método e cronograma.',
        type: 'course',
        category: 'Carreira',
        image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://go.hotmart.com/K103431560F',
        price: null,
        tags: ['francês', 'idiomas', 'imersão', 'a1', 'a2', 'b1', 'b2', 'conversação'],
        featured: true,
        created_at: '2025-04-10T12:00:00Z'
    },
    {
        id: 'local-035',
        title: 'Eletrônica de Notebook: Placa-Mãe do Zero ao Avançado (com consertos ao vivo)',
        description: 'Aprenda eletrônica aplicada a circuitos e placa-mãe de notebook: funcionamento, testes de componentes e diagnóstico de defeitos com consertos reais. Inclui gestão da assistência técnica (administração, contabilidade, caixa e marketing).',
        type: 'course',
        category: 'Carreira',
        image_url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://go.hotmart.com/A103431770E',
        price: null,
        tags: ['eletrônica', 'notebook', 'placa mãe', 'manutenção', 'diagnóstico', 'assistência técnica', 'negócio'],
        featured: true,
        created_at: '2025-04-11T12:00:00Z'
    },
    {
        id: 'local-036',
        title: 'Administração para Administradores: Domine e Gabarite Provas (Concursos)',
        description: 'Guia direto ao ponto para revisão e questões: teorias administrativas, administração geral e pública, gestão de pessoas, materiais, processos, qualidade e projetos — com cronograma e bônus para acelerar sua aprovação.',
        type: 'course',
        category: 'Carreira',
        image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
        link_url: 'https://go.hotmart.com/S103432334C',
        price: null,
        tags: ['administração', 'concursos', 'questões', 'administração pública', 'gestão', 'provas', 'cronograma'],
        featured: true,
        created_at: '2025-04-12T12:00:00Z'
    }
];

function normalizeCatalogTitle(title: string): string {
    return (title || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function isCleanCodeTitle(title: string): boolean {
    return (title || '').toLowerCase().includes('clean code');
}

const AFFILIATE_COURSE_URLS = new Set<string>([
    'https://go.hotmart.com/C103429094N',
    'https://go.hotmart.com/E103431399C',
    'https://go.hotmart.com/K103431560F',
    'https://go.hotmart.com/A103431770E',
    'https://go.hotmart.com/S103432334C'
]);

function filterCoursesToAffiliateOnly(items: CatalogItem[]): CatalogItem[] {
    return items.filter(item => {
        if (item.type !== 'course') return true;
        return AFFILIATE_COURSE_URLS.has((item.link_url || '').trim());
    });
}

function applyLocalFilters(items: CatalogItem[], filters?: CatalogFilter): CatalogItem[] {
    if (!filters) return items;

    let out = items;
    if (filters.type && filters.type !== 'all') {
        out = out.filter(i => i.type === filters.type);
    }
    if (filters.category && filters.category !== 'all') {
        out = out.filter(i => i.category === filters.category);
    }
    if (filters.search) {
        const q = filters.search.trim().toLowerCase();
        if (q) out = out.filter(i => i.title.toLowerCase().includes(q));
    }
    return out;
}

function mergeRemoteWithLocal(remote: CatalogItem[], local: CatalogItem[]): CatalogItem[] {
    const merged = [...remote];
    const existingTitles = new Set(merged.map(i => normalizeCatalogTitle(i.title || '')));

    for (const localItem of local) {
        const localKey = normalizeCatalogTitle(localItem.title || '');

        const existingIndex = merged.findIndex(remoteItem => {
            const remoteKey = normalizeCatalogTitle(remoteItem.title || '');
            if (remoteKey && localKey && remoteKey === localKey) return true;
            return isCleanCodeTitle(remoteItem.title) && isCleanCodeTitle(localItem.title);
        });

        if (existingIndex >= 0) {
            const remoteItem = merged[existingIndex];
            merged[existingIndex] = {
                ...remoteItem,
                ...localItem,
                id: remoteItem.id,
                created_at: remoteItem.created_at || localItem.created_at,
                price: localItem.price ?? remoteItem.price,
                image_url: localItem.image_url ?? remoteItem.image_url,
                link_url: localItem.link_url ?? remoteItem.link_url,
                description: localItem.description ?? remoteItem.description,
                tags: localItem.tags ?? remoteItem.tags
            };
            existingTitles.add(normalizeCatalogTitle(merged[existingIndex].title || ''));
            continue;
        }

        if (!existingTitles.has(localKey)) {
            merged.push(localItem);
            existingTitles.add(localKey);
        }
    }

    return merged;
}

export const catalogService = {
    /**
     * Fetch catalog items with optional filters
     */
    async getItems(filters?: CatalogFilter): Promise<CatalogItem[]> {
        const supabase = supabaseService.getClient();
        if (!supabase) {
            return filterCoursesToAffiliateOnly(applyLocalFilters(LOCAL_CATALOG_ITEMS, filters));
        }

        let query = supabase
            .from('catalog_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters) {
            if (filters.type && filters.type !== 'all') {
                query = query.eq('type', filters.type);
            }
            if (filters.category && filters.category !== 'all') {
                query = query.eq('category', filters.category);
            }
            if (filters.search) {
                query = query.ilike('title', `%${filters.search}%`);
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching catalog items:', error);
            return filterCoursesToAffiliateOnly(applyLocalFilters(LOCAL_CATALOG_ITEMS, filters));
        }

        const remoteItems = (data as CatalogItem[]) ?? [];
        const localFiltered = applyLocalFilters(LOCAL_CATALOG_ITEMS, filters);

        // If the database has few items (e.g. not seeded yet), merge in a local dataset
        // to keep the catalog feeling populated.
        if (remoteItems.length < 24) {
            return filterCoursesToAffiliateOnly(mergeRemoteWithLocal(remoteItems, localFiltered));
        }

        return filterCoursesToAffiliateOnly(remoteItems);
    },

    /**
     * Get featured items
     */
    async getFeaturedItems(): Promise<CatalogItem[]> {
        const supabase = supabaseService.getClient();
        if (!supabase) return filterCoursesToAffiliateOnly(LOCAL_CATALOG_ITEMS.filter(i => i.featured)).slice(0, 4);

        const { data, error } = await supabase
            .from('catalog_items')
            .select('*')
            .eq('featured', true)
            .limit(4);

        if (error) {
            console.error('Error fetching featured items:', error);
            return filterCoursesToAffiliateOnly(LOCAL_CATALOG_ITEMS.filter(i => i.featured)).slice(0, 4);
        }

        const remoteFeatured = (data as CatalogItem[]) ?? [];
        if (remoteFeatured.length < 4) {
            const localFeatured = LOCAL_CATALOG_ITEMS.filter(i => i.featured);
            return filterCoursesToAffiliateOnly(mergeRemoteWithLocal(remoteFeatured, localFeatured)).slice(0, 4);
        }

        return filterCoursesToAffiliateOnly(remoteFeatured);
    }
};
