import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Brain, CreditCard, Shield, Scale, RefreshCw, UserX, AlertTriangle, Mail } from 'lucide-react';

export const TermsPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Termos de Uso - CaminhoProfissionaIA";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", "Termos de Uso da plataforma CaminhoProfissionaIA. Conheça as regras, responsabilidades e direitos ao utilizar nosso serviço de orientação profissional com IA.");
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
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-8 h-8 text-teal-400" />
                        <h1 className="text-4xl font-extrabold text-white">Termos de Uso</h1>
                    </div>
                    <p className="text-slate-500 text-sm">Última atualização: 28 de janeiro de 2026</p>
                </div>

                {/* Introduction */}
                <section className="mb-8">
                    <p className="text-slate-300 leading-relaxed text-lg">
                        Ao acessar e utilizar a plataforma <strong className="text-white">CaminhoProfissionaIA</strong>,
                        você concorda com estes Termos de Uso. Por favor, leia atentamente antes de utilizar nossos serviços.
                    </p>
                </section>

                <div className="space-y-8">
                    {/* Section 1 */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-start gap-4 mb-4">
                            <Brain className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <h2 className="text-2xl font-bold text-white m-0">1. Sobre o Serviço</h2>
                        </div>
                        <div className="pl-10 space-y-4">
                            <p className="text-slate-300 leading-relaxed">
                                A CaminhoProfissionaIA é uma plataforma que utiliza Inteligência Artificial para:
                            </p>
                            <ul className="list-disc pl-5 text-slate-300 space-y-2">
                                <li>Analisar perfis profissionais e currículos</li>
                                <li>Gerar relatórios personalizados e recomendações de carreira</li>
                                <li>Fornecer planos de ação baseados em dados de mercado</li>
                                <li>Simular trajetórias profissionais e comparar carreiras</li>
                            </ul>
                            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mt-4">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-slate-300 text-sm">
                                        <strong className="text-amber-400">Importante:</strong> A IA é uma ferramenta de apoio e orientação.
                                        Nenhuma recomendação garante emprego, promoção ou resultados profissionais específicos.
                                        As decisões finais de carreira são de responsabilidade exclusiva do usuário.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-start gap-4 mb-4">
                            <Shield className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <h2 className="text-2xl font-bold text-white m-0">2. Uso Permitido</h2>
                        </div>
                        <div className="pl-10">
                            <p className="text-slate-300 leading-relaxed mb-3">
                                Ao utilizar nossa plataforma, você concorda em:
                            </p>
                            <ul className="list-disc pl-5 text-slate-300 space-y-2">
                                <li>Fornecer informações verdadeiras, precisas e atualizadas</li>
                                <li>Utilizar a plataforma apenas para fins legítimos e lícitos</li>
                                <li>Não tentar burlar, hackear ou copiar o funcionamento da plataforma</li>
                                <li>Não realizar engenharia reversa dos algoritmos de IA</li>
                                <li>Não compartilhar sua conta com terceiros</li>
                                <li>Manter suas credenciais de acesso em sigilo</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-start gap-4 mb-4">
                            <CreditCard className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <h2 className="text-2xl font-bold text-white m-0">3. Assinatura e Pagamentos</h2>
                        </div>
                        <div className="pl-10 space-y-4">
                            <p className="text-slate-300 leading-relaxed">
                                Ao contratar nossos serviços pagos, você concorda com os seguintes termos:
                            </p>
                            <ul className="list-disc pl-5 text-slate-300 space-y-2">
                                <li><strong className="text-white">Cobrança:</strong> Os valores serão cobrados conforme o plano escolhido (mensal, anual, etc.)</li>
                                <li><strong className="text-white">Renovação:</strong> Assinaturas são renovadas automaticamente até o cancelamento</li>
                                <li><strong className="text-white">Cancelamento:</strong> Você pode cancelar a qualquer momento, sem multa ou taxa adicional</li>
                                <li><strong className="text-white">Reembolso:</strong> Não há reembolso de períodos já utilizados, exceto em casos previstos por lei (CDC)</li>
                                <li><strong className="text-white">Processamento:</strong> Pagamentos são processados por intermediadores seguros (Mercado Pago)</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-start gap-4 mb-4">
                            <Scale className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <h2 className="text-2xl font-bold text-white m-0">4. Propriedade Intelectual</h2>
                        </div>
                        <div className="pl-10">
                            <p className="text-slate-300 leading-relaxed mb-3">
                                Todo o conteúdo da plataforma é protegido por leis de direitos autorais e propriedade intelectual:
                            </p>
                            <ul className="list-disc pl-5 text-slate-300 space-y-2">
                                <li>Textos, imagens, logotipos e elementos visuais</li>
                                <li>Algoritmos, códigos e metodologias de IA</li>
                                <li>Relatórios e análises geradas pela plataforma</li>
                                <li>Interface, design e experiência do usuário</li>
                            </ul>
                            <p className="text-slate-400 text-sm mt-4">
                                É expressamente proibido copiar, reproduzir, distribuir ou criar obras derivadas sem autorização prévia por escrito.
                            </p>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-start gap-4 mb-4">
                            <AlertTriangle className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <h2 className="text-2xl font-bold text-white m-0">5. Limitação de Responsabilidade</h2>
                        </div>
                        <div className="pl-10">
                            <p className="text-slate-300 leading-relaxed mb-3">
                                A CaminhoProfissionaIA não se responsabiliza por:
                            </p>
                            <ul className="list-disc pl-5 text-slate-300 space-y-2">
                                <li>Decisões profissionais tomadas pelo usuário com base nas recomendações</li>
                                <li>Resultados de processos seletivos, promoções ou mudanças de carreira</li>
                                <li>Perdas financeiras decorrentes de escolhas pessoais</li>
                                <li>Indisponibilidade temporária do serviço por manutenção ou falhas técnicas</li>
                                <li>Ações de terceiros que afetem a experiência do usuário</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-start gap-4 mb-4">
                            <RefreshCw className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <h2 className="text-2xl font-bold text-white m-0">6. Alterações no Serviço</h2>
                        </div>
                        <div className="pl-10">
                            <p className="text-slate-300 leading-relaxed mb-3">
                                Reservamo-nos o direito de, a qualquer momento e com aviso prévio quando aplicável:
                            </p>
                            <ul className="list-disc pl-5 text-slate-300 space-y-2">
                                <li>Atualizar, modificar ou descontinuar funcionalidades</li>
                                <li>Alterar preços de planos e assinaturas</li>
                                <li>Modificar estes Termos de Uso</li>
                                <li>Encerrar serviços que não sejam mais viáveis</li>
                            </ul>
                            <p className="text-slate-400 text-sm mt-4">
                                Alterações significativas serão comunicadas por e-mail ou aviso na plataforma.
                            </p>
                        </div>
                    </section>

                    {/* Section 7 */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-start gap-4 mb-4">
                            <UserX className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <h2 className="text-2xl font-bold text-white m-0">7. Suspensão e Cancelamento de Conta</h2>
                        </div>
                        <div className="pl-10">
                            <p className="text-slate-300 leading-relaxed mb-3">
                                Podemos suspender ou encerrar contas que:
                            </p>
                            <ul className="list-disc pl-5 text-slate-300 space-y-2">
                                <li>Violarem estes Termos de Uso</li>
                                <li>Tentarem fraudar o sistema ou outros usuários</li>
                                <li>Realizarem atividades que representem risco de segurança</li>
                                <li>Utilizarem a plataforma para fins ilícitos</li>
                                <li>Permanecerem inativas por período prolongado</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 8: Governing Law */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-start gap-4 mb-4">
                            <Scale className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <h2 className="text-2xl font-bold text-white m-0">8. Lei Aplicável e Foro</h2>
                        </div>
                        <div className="pl-10">
                            <p className="text-slate-300 leading-relaxed">
                                Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil.
                                Fica eleito o foro da comarca de Natal/RN para dirimir quaisquer controvérsias
                                decorrentes deste instrumento, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                            </p>
                        </div>
                    </section>

                    {/* Contact Section */}
                    <section className="p-6 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 rounded-xl border border-teal-500/30">
                        <div className="flex items-start gap-4">
                            <Mail className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-3">9. Contato</h2>
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    Dúvidas sobre estes Termos de Uso? Entre em contato conosco:
                                </p>
                                <a
                                    href="mailto:alexandrehenriquefdes@gmail.com"
                                    className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 font-medium"
                                >
                                    alexandrehenriquefdes@gmail.com
                                </a>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};
