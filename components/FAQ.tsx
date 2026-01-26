import React, { useState } from 'react';
import { faq } from '../data/content';

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-slate-800">
            <button
                className="w-full py-6 flex justify-between items-center text-left focus:outline-none group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`text-lg font-medium transition-colors ${isOpen ? 'text-teal-400' : 'text-slate-200 group-hover:text-white'}`}>
                    {question}
                </span>
                <span className={`ml-6 flex-shrink-0 w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center transition-all ${isOpen ? 'bg-teal-500 border-teal-500 text-slate-900 rotate-180' : 'text-slate-400'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
                <p className="text-slate-400 leading-relaxed pr-12">
                    {answer}
                </p>
            </div>
        </div>
    );
};

export const FAQ: React.FC = () => {
    return (
        <section id="faq" className="py-24 bg-slate-950">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Perguntas Frequentes</h2>
                    <p className="text-slate-400">Tire suas dúvidas sobre nossa plataforma.</p>
                </div>

                <div className="space-y-2">
                    {faq.map((item, index) => (
                        <FAQItem key={index} question={item.question} answer={item.answer} />
                    ))}
                </div>
            </div>
        </section>
    );
};
