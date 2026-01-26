import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const TermsPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Termos de Uso - O Caminho Profissional";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", "Termos de Uso da plataforma O Caminho Profissional. Conheça as regras, responsabilidades e direitos ao utilizar nosso serviço.");
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
                    <h1 className="text-4xl font-extrabold mb-8">Termos de Uso</h1>

                    <p className="text-sm text-slate-500 mb-8">Última atualização: 18 de janeiro de 2026</p>

                    <p>Ao acessar e utilizar a plataforma <strong>Caminho Profissional</strong>, você concorda com estes Termos de Uso.</p>

                    <hr />

                    <h2>1. Sobre o serviço</h2>
                    <p>A plataforma utiliza Inteligência Artificial para:</p>
                    <ul>
                        <li>Analisar perfis profissionais</li>
                        <li>Gerar relatórios e recomendações</li>
                        <li>Fornecer plano de ação baseado em dados de mercado</li>
                    </ul>
                    <p>O usuário entende que:</p>
                    <ul>
                        <li>A IA é uma ferramenta de apoio</li>
                        <li>Nenhuma recomendação garante emprego ou resultados profissionais específicos</li>
                    </ul>

                    <hr />

                    <h2>2. Uso permitido</h2>
                    <p>Você concorda em:</p>
                    <ul>
                        <li>Fornecer informações verdadeiras</li>
                        <li>Não utilizar o sistema para fins ilegais</li>
                        <li>Não tentar burlar ou copiar o funcionamento da plataforma</li>
                        <li>Não fazer engenharia reversa da IA</li>
                    </ul>

                    <hr />

                    <h2>3. Assinatura e Pagamentos</h2>
                    <p>Ao assinar nossos serviços, você concorda com:</p>
                    <ul>
                        <li>Cobrança recorrente até cancelamento</li>
                        <li>Cancelamento a qualquer momento sem multa</li>
                        <li>Não reembolso de períodos já utilizados (exceto casos previstos por lei)</li>
                    </ul>

                    <hr />

                    <h2>4. Propriedade intelectual</h2>
                    <p>Todo o conteúdo da plataforma é protegido por:</p>
                    <ul>
                        <li>Direitos autorais</li>
                        <li>Leis de propriedade intelectual</li>
                    </ul>
                    <p>É proibido copiar textos, relatórios, interface ou algoritmos.</p>

                    <hr />

                    <h2>5. Limitação de responsabilidade</h2>
                    <p>A plataforma não se responsabiliza por:</p>
                    <ul>
                        <li>Decisões profissionais tomadas pelo usuário</li>
                        <li>Resultados de carreira</li>
                        <li>Perdas financeiras decorrentes de escolhas pessoais</li>
                    </ul>

                    <hr />

                    <h2>6. Alterações no serviço</h2>
                    <p>Podemos:</p>
                    <ul>
                        <li>Atualizar funcionalidades</li>
                        <li>Modificar preços</li>
                        <li>Encerrar serviços</li>
                    </ul>
                    <p>Com aviso prévio quando aplicável.</p>

                    <hr />

                    <h2>7. Cancelamento de conta</h2>
                    <p>Podemos suspender contas que:</p>
                    <ul>
                        <li>Violarem estes termos</li>
                        <li>Tentarem fraudar o sistema</li>
                        <li>Representarem risco de segurança</li>
                    </ul>

                    <hr />

                    <h2>8. Contato</h2>
                    <p>
                        <strong className="text-white">alexandrehenriquefdes@gmail.com</strong>
                    </p>
                </div>
            </main>
        </div>
    );
};
