import React from 'react';
import { BrainIcon } from '../components/icons/BrainIcon';
import { RocketIcon } from '../components/icons/RocketIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';

// Using a helper to return icons since we can't store React components directly in JSON easily if we want to keep it pure data, 
// but for this TS file it's fine to return the component or the element.
// We will store the component function or element.

export const features = [
    {
        id: 'analysis',
        title: 'Análise Profunda',
        description: 'A IA investiga não apenas o que você gosta, mas como você pensa, seus valores e seu estilo de vida ideal.',
        icon: BrainIcon,
        gradient: 'from-slate-800 to-slate-900',
        border: 'hover:border-teal-500/50',
        glow: 'group-hover:shadow-teal-500/20',
        iconColor: 'text-teal-400',
        details: 'Nossa análise utiliza algoritmos avançados de processamento de linguagem natural para entender as nuances das suas respostas. Diferente de testes de múltipla escolha, nós ouvimos você.'
    },
    {
        id: 'market',
        title: 'Mercado Real',
        description: 'Sugestões baseadas em dados reais de mercado, salários e demanda atual na sua região.',
        icon: TrendingUpIcon,
        gradient: 'from-slate-800 to-slate-900',
        border: 'hover:border-sky-500/50',
        glow: 'group-hover:shadow-sky-500/20',
        iconColor: 'text-sky-400',
        details: 'Conectamos suas paixões com a realidade. Analisamos tendências de vagas, faixas salariais e crescimento de setores para garantir que sua escolha seja sustentável.'
    },
    {
        id: 'action',
        title: 'Plano de Ação',
        description: 'Não receba apenas um nome de profissão. Receba um guia passo a passo de como chegar lá.',
        icon: RocketIcon,
        gradient: 'from-slate-800 to-slate-900',
        border: 'hover:border-purple-500/50',
        glow: 'group-hover:shadow-purple-500/20',
        iconColor: 'text-purple-400',
        details: 'Do zero ao primeiro emprego. Criamos um roadmap personalizado com cursos, certificações, projetos práticos e dicas de networking para sua nova carreira.'
    },
    {
        id: 'mentorship',
        title: 'Mentoria IA',
        description: 'Tire dúvidas a qualquer momento com nosso assistente virtual especializado em carreiras.',
        icon: BrainIcon, // Reusing BrainIcon for now or we could add a ChatIcon
        gradient: 'from-slate-800 to-slate-900',
        border: 'hover:border-emerald-500/50',
        glow: 'group-hover:shadow-emerald-500/20',
        iconColor: 'text-emerald-400',
        details: 'Um mentor disponível 24/7. Pergunte sobre como melhorar seu currículo, como se portar em entrevistas ou qual tecnologia aprender primeiro.'
    }
];

export const testimonials = [
    {
        id: 1,
        name: 'Maria Silva',
        role: 'Desenvolvedora Frontend',
        text: 'O Caminho Profissional me ajudou a transicionar do Marketing para TI. O plano de ação foi fundamental!',
        avatar: 'M'
    },
    {
        id: 2,
        name: 'João Santos',
        role: 'Analista de Dados',
        text: 'Eu estava perdido sem saber qual área de tecnologia seguir. A análise de perfil foi certeira.',
        avatar: 'J'
    },
    {
        id: 3,
        name: 'Ana Costa',
        role: 'UX Designer',
        text: 'Amei a interface e como a IA entendeu exatamente o que eu buscava em um ambiente de trabalho.',
        avatar: 'A'
    }
];

export const faq = [
    {
        question: 'O que é o CaminhoProfissionaIA?',
        answer: 'É uma plataforma de orientação profissional que utiliza Inteligência Artificial para ajudar você a descobrir sua vocação, explorar carreiras e criar um plano de ação personalizado para alcançar seus objetivos profissionais.'
    },
    {
        question: 'Como funciona a Descoberta de Carreira?',
        answer: 'Nossa IA realiza uma entrevista interativa com você, analisando suas respostas para identificar padrões de comportamento, interesses e aptidões. O processo leva entre 10 a 15 minutos e as perguntas são adaptadas conforme suas respostas.'
    },
    {
        question: 'O que é o Explorar Carreiras?',
        answer: 'É um catálogo completo de profissões onde você pode navegar, filtrar por área de interesse e descobrir novas oportunidades. Cada carreira inclui informações sobre salário médio, mercado de trabalho e habilidades necessárias.'
    },
    {
        question: 'Como funciona o Comparador de Carreiras?',
        answer: 'O comparador permite que você selecione até 3 carreiras e veja uma análise lado a lado com dados sobre salário médio, perspectiva de crescimento, demanda de mercado e nível de satisfação profissional.'
    },
    {
        question: 'O que está incluído no Plano de Ação?',
        answer: 'Você recebe um roteiro passo a passo personalizado com: cursos recomendados, certificações importantes, projetos práticos para construir portfólio, estratégias de networking e um cronograma realista para sua transição de carreira.'
    },
    {
        question: 'Preciso pagar para usar a plataforma?',
        answer: 'A descoberta inicial é gratuita. Para acessar recursos completos como o Plano de Ação detalhado, Comparador de Carreiras e conteúdo exclusivo, oferecemos planos acessíveis. Você pode cancelar a qualquer momento, sem multas.'
    },
    {
        question: 'Posso refazer a análise de carreira?',
        answer: 'Sim! Entendemos que as pessoas evoluem. Você pode refazer a Descoberta de Carreira quantas vezes quiser para ver como seus interesses mudaram ao longo do tempo.'
    },
    {
        question: 'Meus dados estão seguros?',
        answer: 'Absolutamente. Seguimos a LGPD (Lei Geral de Proteção de Dados) e utilizamos criptografia para proteger suas informações. Seus dados nunca são vendidos a terceiros. Consulte nossa Política de Privacidade para mais detalhes.'
    },
    {
        question: 'A IA realmente funciona para orientação profissional?',
        answer: 'Sim! Nossa IA é treinada com dados de milhares de perfis profissionais reais e tendências de mercado atualizadas. Ela identifica padrões que humanos podem não perceber, oferecendo sugestões personalizadas e baseadas em dados concretos.'
    }
];

export const catalog = [
    {
        id: 'c1',
        title: 'Fundamentos de Desenvolvimento Web',
        category: 'Programação',
        duration: '40h',
        level: 'Iniciante',
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'c2',
        title: 'Introdução a Data Science com Python',
        category: 'Dados',
        duration: '60h',
        level: 'Iniciante',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'c3',
        title: 'UX/UI Design: Do Zero ao Protótipo',
        category: 'Design',
        duration: '45h',
        level: 'Iniciante',
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'c4',
        title: 'Marketing Digital e Growth Hacking',
        category: 'Marketing',
        duration: '30h',
        level: 'Intermediário',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
    }
];
