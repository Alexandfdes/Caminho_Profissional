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
        question: 'Como funciona a análise de perfil?',
        answer: 'Nossa IA realiza uma entrevista interativa com você, analisando suas respostas para identificar padrões de comportamento, interesses e aptidões, cruzando com dados de milhares de carreiras.'
    },

    {
        question: 'Quanto tempo leva para concluir a análise?',
        answer: 'O processo é dinâmico e depende do seu ritmo, mas geralmente leva entre 10 a 15 minutos. Nossa IA adapta as perguntas conforme suas respostas para ser o mais objetiva possível.'
    },
    {
        question: 'Como a IA garante a precisão dos resultados?',
        answer: 'Utilizamos modelos avançados de linguagem treinados em milhares de trajetórias profissionais reais. A IA cruza seu perfil comportamental com dados atualizados de mercado para encontrar o "match" ideal.'
    },
    {
        question: 'O que está incluído no Plano de Ação?',
        answer: 'Você receberá um roteiro passo a passo com sugestões de cursos, certificações, projetos práticos para construir portfólio e estratégias de networking específicas para a carreira sugerida.'
    },
    {
        question: 'Posso cancelar a assinatura a qualquer momento?',
        answer: 'Sim! Se você optar pelo plano de assinatura, pode cancelar quando quiser através do seu painel de usuário, sem multas ou fidelidade.'
    },
    {
        question: 'Os dados de mercado são atualizados?',
        answer: 'Sim, nossa base de dados é atualizada constantemente com informações de vagas reais e relatórios de tendências de mercado.'
    },
    {
        question: 'Posso refazer o teste?',
        answer: 'Com certeza. Entendemos que as pessoas mudam. Você pode refazer a análise a qualquer momento para ver se seus interesses evoluíram.'
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
