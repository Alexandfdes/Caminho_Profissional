import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const AboutPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Sobre Nós - O Caminho Profissional";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", "Conheça o Caminho Profissional. Nossa missão é usar IA para guiar talentos e transformar carreiras com clareza e propósito.");
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span>Voltar para Home</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                <div className="prose prose-invert prose-slate max-w-none prose-headings:font-outfit prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-hr:border-slate-800">
                    <h1 className="text-4xl font-extrabold mb-8">Sobre Nós</h1>

                    <p className="text-lg leading-relaxed mb-12">
                        A <strong>Caminho Profissional</strong> é uma plataforma criada para ajudar pessoas a descobrirem sua verdadeira vocação por meio da Inteligência Artificial.
                    </p>

                    <h2>Nossa missão é:</h2>
                    <ul>
                        <li>Guiar pessoas com clareza</li>
                        <li>Oferecer análises profundas e personalizadas</li>
                        <li>Aproximar talentos das oportunidades reais do mercado</li>
                    </ul>

                    <hr className="my-12" />

                    <h2>Tecnologia e Visão</h2>
                    <p>Utilizamos IA avançada capaz de:</p>
                    <ul>
                        <li>Entender perfil psicológico</li>
                        <li>Mapear interesses</li>
                        <li>Analisar habilidades</li>
                        <li>Conectar com dados reais de empregabilidade</li>
                    </ul>

                    <p className="mt-8">
                        Acreditamos que todo mundo merece encontrar sua direção — e estamos aqui para facilitar esse caminho.
                    </p>
                </div>
            </main>
        </div>
    );
};
