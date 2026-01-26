import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Política de Privacidade - O Caminho Profissional";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", "Leia nossa Política de Privacidade. Saiba como o Caminho Profissional protege seus dados e utiliza cookies para melhorar sua experiência.");
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
                    <h1 className="text-4xl font-extrabold mb-8">Política de Privacidade</h1>

                    <p className="text-sm text-slate-500 mb-8">Última atualização: 18 de janeiro de 2026</p>

                    <p>
                        A Plataforma <strong>Caminho Profissional</strong> (“nós”, “nosso”, “nosso site”) se compromete a proteger a privacidade e os dados pessoais de seus usuários. Esta Política de Privacidade explica como coletamos, utilizamos, armazenamos e protegemos suas informações.
                    </p>
                    <p>Ao utilizar nosso site, você concorda com os termos desta Política.</p>

                    <hr />

                    <h2>1. Informações que coletamos</h2>
                    <p>Coletamos as seguintes informações:</p>

                    <h3>a) Informações fornecidas diretamente pelo usuário</h3>
                    <ul>
                        <li>Nome</li>
                        <li>E-mail</li>
                        <li>Informações fornecidas durante a análise de perfil</li>
                        <li>Dados inseridos na plataforma</li>
                    </ul>

                    <h3>b) Informações coletadas automaticamente</h3>
                    <ul>
                        <li>Cookies</li>
                        <li>Endereço IP</li>
                        <li>Dados de dispositivo e navegador</li>
                        <li>Páginas visitadas</li>
                        <li>Tempo de permanência no site</li>
                    </ul>

                    <h3>c) Informações de terceiros</h3>
                    <p>Parceiros como Google podem coletar dados para fins de análise, segurança e publicidade.</p>

                    <hr />

                    <h2>2. Uso de cookies e tecnologias similares</h2>
                    <p>Utilizamos cookies para:</p>
                    <ul>
                        <li>Melhorar sua experiência</li>
                        <li>Lembrar preferências</li>
                        <li>Analisar uso do site</li>
                        <li>Exibir anúncios relevantes (incluindo Google AdSense)</li>
                    </ul>

                    <p><strong>Terceiros, incluindo o Google</strong>, podem usar cookies para:</p>
                    <ul>
                        <li>Exibir anúncios personalizados</li>
                        <li>Medir desempenho</li>
                        <li>Realizar análises de tráfego</li>
                    </ul>
                    <p>
                        Saiba como o Google usa dados: <br />
                        <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">https://policies.google.com/technologies/partner-sites</a>
                    </p>

                    <hr />

                    <h2>3. Como usamos suas informações</h2>
                    <p>As informações coletadas podem ser utilizadas para:</p>
                    <ul>
                        <li>Personalizar sua análise de carreira</li>
                        <li>Melhorar a plataforma</li>
                        <li>Processar assinaturas e pagamentos</li>
                        <li>Enviar comunicações importantes</li>
                        <li>Exibir anúncios (quando aplicável)</li>
                        <li>Garantir segurança do sistema</li>
                    </ul>

                    <hr />

                    <h2>4. Compartilhamento de dados</h2>
                    <p>Podemos compartilhar informações com:</p>
                    <ul>
                        <li>Google (para análises, anúncios e métricas)</li>
                        <li>Plataformas de pagamento</li>
                        <li>Serviços de hospedagem</li>
                        <li>Parceiros de análise</li>
                    </ul>
                    <p>Não vendemos dados pessoais.</p>

                    <hr />

                    <h2>5. Publicidade e Google AdSense</h2>
                    <p>Nosso site segue todas as políticas de publicidade do Google.</p>
                    <p>O Google pode:</p>
                    <ul>
                        <li>Exibir anúncios com base em navegação anterior</li>
                        <li>Coletar dados via cookies</li>
                        <li>Requerer consentimento de usuários em regiões específicas</li>
                    </ul>
                    <p>
                        Você pode desativar anúncios personalizados aqui: <br />
                        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">https://www.google.com/settings/ads</a>
                    </p>

                    <hr />

                    <h2>6. Segurança</h2>
                    <p>Utilizamos:</p>
                    <ul>
                        <li>Criptografia</li>
                        <li>Firewall</li>
                        <li>Protocolos de segurança atualizados</li>
                    </ul>
                    <p>Mesmo assim, nenhum sistema é 100% seguro.</p>

                    <hr />

                    <h2>7. Direitos do usuário</h2>
                    <p>Você pode:</p>
                    <ul>
                        <li>Solicitar exclusão de dados</li>
                        <li>Solicitar cópia dos dados</li>
                        <li>Corrigir informações</li>
                        <li>Revogar consentimento</li>
                    </ul>
                    <p>
                        Para isso, envie um e-mail para: <br />
                        <strong className="text-white">alexandrehenriquefdes@gmail.com</strong>
                    </p>

                    <hr />

                    <h2>8. Alterações nesta Política</h2>
                    <p>Podemos atualizar esta Política a qualquer momento. A data de atualização estará sempre no início do documento.</p>

                    <hr />

                    <h2>9. Contato</h2>
                    <p>
                        Em caso de dúvidas, fale conosco: <br />
                        <strong className="text-white">alexandrehenriquefdes@gmail.com</strong>
                    </p>
                </div>
            </main>
        </div>
    );
};
