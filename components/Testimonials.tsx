import React from 'react';
import { testimonials } from '../data/content';

export const Testimonials: React.FC = () => {
    return (
        <section id="testimonials" className="py-24 bg-slate-900 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">O que dizem nossos usuários</h2>
                    <p className="text-slate-400">Histórias reais de quem encontrou seu caminho.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t) => (
                        <div key={t.id} className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-sky-500 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-white">
                                        {t.avatar}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{t.name}</h4>
                                    <p className="text-xs text-teal-400">{t.role}</p>
                                </div>
                            </div>
                            <p className="text-slate-300 text-sm italic">"{t.text}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
