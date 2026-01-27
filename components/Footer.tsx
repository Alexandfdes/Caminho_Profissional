import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RocketIcon, Mail, Github, Linkedin, Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    const handleLinkClick = (path: string) => {
        navigate(path);
        window.scrollTo(0, 0);
    };

    return (
        <footer className="bg-slate-950 border-t border-slate-800 pt-20 pb-10 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => handleLinkClick('/')}>
                            <div className="p-2 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg shadow-lg shadow-teal-500/20">
                                <RocketIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 font-outfit">
                                O Caminho Profissional
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Sua bússola na era da inteligência artificial. Descubra sua vocação e trace o plano perfeito para sua carreira.
                        </p>
                        {/* Social links removed to comply with AdSense (no dead links) */}
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Plataforma</h4>
                        <ul className="space-y-4">
                            <li><button onClick={() => handleLinkClick('/planos')} className="text-slate-400 hover:text-teal-400 text-sm transition-colors">Planos e Preços</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Institucional</h4>
                        <ul className="space-y-4">
                            <li><button onClick={() => handleLinkClick('/sobre')} className="text-slate-400 hover:text-teal-400 text-sm transition-colors">Sobre Nós</button></li>
                            <li><button onClick={() => handleLinkClick('/politica-de-privacidade')} className="text-slate-400 hover:text-teal-400 text-sm transition-colors">Política de Privacidade</button></li>
                            <li><button onClick={() => handleLinkClick('/termos-de-uso')} className="text-slate-400 hover:text-teal-400 text-sm transition-colors">Termos de Uso</button></li>
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Contato</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <Mail className="w-4 h-4 text-teal-400 mt-1" />
                                <a href="mailto:suporte@caminhoprofissional.com" className="text-slate-400 hover:text-teal-400 text-sm transition-colors">
                                    suporte@caminhoprofissional.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-xs">
                        © {currentYear} O Caminho Profissional. Todos os direitos reservados.
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Powered by Gemini IA</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
