import React, { useState, useRef, useEffect } from 'react';
import { BrainIcon } from './icons/BrainIcon';
import { generateChatResponse } from '../services/geminiService';

export const ChatMock: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
        { text: 'Olá! Sou o assistente virtual do Caminho Profissional. Como posso te ajudar hoje?', isUser: false }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isTyping]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = inputValue;
        setMessages(prev => [...prev, { text: userMsg, isUser: true }]);
        setInputValue('');
        setIsTyping(true);

        try {
            // Retry automático com errorService
            const response = await generateChatResponse(userMsg, messages);
            setMessages(prev => [...prev, { text: response, isUser: false }]);
        } catch (error) {
            // Mensagem de erro mais específica
            const errorMessage = error instanceof Error && error.message.toLowerCase().includes('network')
                ? "Parece que você está offline. Verifique sua conexão e tente novamente."
                : error instanceof Error && error.message.toLowerCase().includes('api')
                    ? "Estou com dificuldades para processar sua mensagem. Tente novamente em alguns instantes."
                    : "Desculpe, tive um problema inesperado. Tente novamente.";

            setMessages(prev => [...prev, { text: errorMessage, isUser: false }]);
            console.error('Chat error:', error);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            <div className={`mb-4 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 h-0'}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <BrainIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Assistente de Carreira</h3>
                        <p className="text-teal-100 text-xs flex items-center gap-1">
                            <span className={`w-2 h-2 bg-green-400 rounded-full ${isTyping ? 'animate-ping' : 'animate-pulse'}`}></span>
                            {isTyping ? 'Digitando...' : 'Online'}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="ml-auto text-white/80 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-900">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.isUser
                                ? 'bg-teal-600 text-white rounded-tr-none'
                                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-tl-none flex gap-1">
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Digite sua dúvida..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                        disabled={isTyping}
                    />
                    <button
                        type="submit"
                        disabled={isTyping || !inputValue.trim()}
                        className="p-2 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${isOpen
                    ? 'bg-slate-800 text-white rotate-90'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-teal-500/30'
                    }`}
            >
                {isOpen ? (
                    <span className="text-xl font-bold">✕</span>
                ) : (
                    <BrainIcon className="w-7 h-7" />
                )}
            </button>
        </div>
    );
};
