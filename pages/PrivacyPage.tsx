import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, Cookie, Database, Eye, UserCheck, Mail, ExternalLink } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Política de Privacidade - CaminhoProfissionaIA";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", "Política de Privacidade da CaminhoProfissionaIA. Saiba como coletamos, usamos e protegemos seus dados em conformidade com a LGPD e GDPR.");
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
                        <Shield className="w-8 h-8 text-teal-400" />
                        <h1 className="text-4xl font-extrabold text-white">Política de Privacidade</h1>
                    </div>
                    <p className="text-slate-500 text-sm">Última atualização: 28 de janeiro de 2026</p>
                </div>

                <div className="prose prose-invert prose-slate max-w-none space-y-12">
                    {/* Introduction */}
                    <section>
                        <p className="text-slate-300 leading-relaxed text-lg">
                            A <strong className="text-white">CaminhoProfissionaIA</strong> ("nós", "nosso" ou "plataforma") está comprometida
                            com a proteção da privacidade e dos dados pessoais de seus usuários. Esta Política de Privacidade
                            descreve como coletamos, utilizamos, armazenamos e protegemos suas informações em conformidade
                            com a <strong className="text-teal-400">Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong> e
                            o <strong className="text-teal-400">Regulamento Geral sobre a Proteção de Dados (GDPR)</strong> da União Europeia.
                        </p>
                    </section>

                    {/* Section 1: Data Collection */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-start gap-4 mb-4">
                            <Database className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <h2 className="text-2xl font-bold text-white m-0">1. Dados que Coletamos</h2>
                        </div>
                        <div className="pl-10 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">1.1 Dados Fornecidos pelo Usuário</h3>
                                <ul className="list-disc pl-5 text-slate-300 space-y-1">
                                    <li>Nome completo e endereço de e-mail</li>
                                    <li>Informações de perfil profissional (currículo, experiências, formação)</li>
                                    <li>Respostas a questionários e avaliações de carreira</li>
                                    <li>Dados de pagamento (processados por terceiros seguros)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">1.2 Dados Coletados Automaticamente</h3>
                                <ul className="list-disc pl-5 text-slate-300 space-y-1">
                                    <li><strong>Logs de Acesso:</strong> Endereço IP, data e hora de acesso, páginas visitadas</li>
                                    <li><strong>Device ID:</strong> Identificadores únicos do dispositivo</li>
                                    <li><strong>Cookies e Tecnologias Similares:</strong> Informações de navegação e preferências</li>
                                    <li><strong>Dados de Navegador:</strong> Tipo, versão e configurações do navegador</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Cookies and Third Parties */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-start gap-4 mb-4">
                            <Cookie className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <h2 className="text-2xl font-bold text-white m-0">2. Cookies e Fornecedores Terceiros</h2>
                        </div>
                        <div className="pl-10 space-y-4">
                            <p className="text-slate-300 leading-relaxed">
                                Utilizamos cookies para melhorar sua experiência, lembrar suas preferências,
                                analisar o tráfego do site e exibir anúncios relevantes.
                            </p>

                            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <h3 className="text-lg font-semibold text-amber-400 mb-2">⚠️ Aviso sobre Publicidade de Terceiros</h3>
                                <p className="text-slate-300 leading-relaxed mb-3">
                                    <strong className="text-white">Fornecedores terceiros, incluindo o Google, usam cookies para veicular
                                        anúncios com base nas visitas anteriores do usuário a este site ou outros sites.</strong>
                                </p>
                                <p className="text-slate-300 leading-relaxed mb-3">
                                    O Google utiliza o <strong className="text-white">cookie DART</strong> para veicular anúncios personalizados
                                    aos usuários com base em suas visitas a este site e a outros sites na Internet. Este cookie
                                    permite ao Google e seus parceiros exibir anúncios mais relevantes para você.
                                </p>
                                <p className="text-slate-300 leading-relaxed">
                                    Você pode desativar a personalização de anúncios do Google visitando as
                                    <a
                                        href="https://adssettings.google.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 underline ml-1"
                                    >
                                        Configurações de Anúncios do Google
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                    . Alternativamente, você pode desativar o uso de cookies de terceiros visitando a página
                                    <a
                                        href="https://www.networkadvertising.org/managing/opt_out.asp"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 underline ml-1"
                                    >
                                        Network Advertising Initiative opt-out
                                        <ExternalLink className="w-3 h-3" />
                                    </a>.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Tipos de Cookies Utilizados</h3>
                                <ul className="list-disc pl-5 text-slate-300 space-y-1">
                                    <li><strong>Cookies Essenciais:</strong> Necessários para o funcionamento básico do site</li>
                                    <li><strong>Cookies de Desempenho:</strong> Coletam informações sobre como você usa o site</li>
                                    <li><strong>Cookies de Funcionalidade:</strong> Lembram suas preferências e configurações</li>
                                    <li><strong>Cookies de Publicidade:</strong> Usados para exibir anúncios relevantes (Google AdSense)</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: How We Use Data */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-start gap-4 mb-4">
                            <Eye className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <h2 className="text-2xl font-bold text-white m-0">3. Como Utilizamos Seus Dados</h2>
                        </div>
                        <div className="pl-10">
                            <ul className="list-disc pl-5 text-slate-300 space-y-2">
                                <li>Fornecer e melhorar nossos serviços de análise de carreira</li>
                                <li>Personalizar sua experiência na plataforma</li>
                                <li>Processar pagamentos e gerenciar assinaturas</li>
                                <li>Enviar comunicações importantes sobre sua conta</li>
                                <li>Exibir anúncios personalizados (quando aplicável)</li>
                                <li>Cumprir obrigações legais e regulatórias</li>
                                <li>Prevenir fraudes e garantir a segurança da plataforma</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 4: Data Sharing */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-start gap-4 mb-4">
                            <UserCheck className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <h2 className="text-2xl font-bold text-white m-0">4. Compartilhamento de Dados</h2>
                        </div>
                        <div className="pl-10 space-y-4">
                            <p className="text-slate-300 leading-relaxed">
                                <strong className="text-white">Não vendemos seus dados pessoais.</strong> Compartilhamos informações apenas nas seguintes situações:
                            </p>
                            <ul className="list-disc pl-5 text-slate-300 space-y-2">
                                <li><strong>Provedores de Serviços:</strong> Empresas que nos ajudam a operar a plataforma (hospedagem, análise, pagamentos)</li>
                                <li><strong>Google:</strong> Para análises de tráfego (Google Analytics) e publicidade (Google AdSense)</li>
                                <li><strong>Exigências Legais:</strong> Quando requerido por lei ou ordem judicial</li>
                                <li><strong>Proteção de Direitos:</strong> Para proteger nossos direitos, privacidade, segurança ou propriedade</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 5: User Rights */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-start gap-4 mb-4">
                            <Shield className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <h2 className="text-2xl font-bold text-white m-0">5. Seus Direitos (LGPD/GDPR)</h2>
                        </div>
                        <div className="pl-10 space-y-4">
                            <p className="text-slate-300 leading-relaxed">
                                De acordo com a LGPD e GDPR, você tem os seguintes direitos sobre seus dados pessoais:
                            </p>
                            <ul className="list-disc pl-5 text-slate-300 space-y-2">
                                <li><strong>Acesso:</strong> Solicitar uma cópia dos dados que temos sobre você</li>
                                <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
                                <li><strong>Exclusão:</strong> Solicitar a exclusão de seus dados pessoais</li>
                                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                                <li><strong>Revogação do Consentimento:</strong> Retirar seu consentimento a qualquer momento</li>
                                <li><strong>Oposição:</strong> Opor-se ao tratamento de dados para fins de marketing</li>
                            </ul>
                            <p className="text-slate-300 leading-relaxed">
                                Para exercer qualquer um desses direitos, entre em contato conosco através do e-mail abaixo.
                            </p>
                        </div>
                    </section>

                    {/* Section 6: Security */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <h2 className="text-2xl font-bold text-white mb-4">6. Segurança dos Dados</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados, incluindo:
                        </p>
                        <ul className="list-disc pl-5 text-slate-300 space-y-1 mt-3">
                            <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
                            <li>Armazenamento seguro em servidores protegidos</li>
                            <li>Controle de acesso restrito a funcionários autorizados</li>
                            <li>Monitoramento contínuo de segurança</li>
                        </ul>
                        <p className="text-slate-400 text-sm mt-4">
                            Nenhum sistema é 100% seguro. Em caso de violação de dados, notificaremos os afetados conforme exigido por lei.
                        </p>
                    </section>

                    {/* Section 7: Updates */}
                    <section className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <h2 className="text-2xl font-bold text-white mb-4">7. Alterações nesta Política</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Podemos atualizar esta Política de Privacidade periodicamente. Quando fizermos alterações significativas,
                            notificaremos você através do e-mail cadastrado ou por meio de aviso em destaque na plataforma.
                            A data de "Última atualização" no topo deste documento reflete a versão mais recente.
                        </p>
                    </section>

                    {/* Contact Section */}
                    <section className="p-6 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 rounded-xl border border-teal-500/30">
                        <div className="flex items-start gap-4">
                            <Mail className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-3">8. Contato</h2>
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    Se você tiver dúvidas sobre esta Política de Privacidade, quiser exercer seus direitos
                                    ou tiver preocupações sobre o tratamento de seus dados, entre em contato conosco:
                                </p>
                                <div className="space-y-2">
                                    <p className="text-white">
                                        <strong>E-mail:</strong>{' '}
                                        <a href="mailto:alexandrehenriquefdes@gmail.com" className="text-teal-400 hover:text-teal-300 underline">
                                            alexandrehenriquefdes@gmail.com
                                        </a>
                                    </p>
                                    <p className="text-white">
                                        <strong>Plataforma:</strong> CaminhoProfissionaIA
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};
