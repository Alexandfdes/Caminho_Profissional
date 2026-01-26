import React, { useState } from 'react';

interface FeatureCardProps {
    feature: {
        id: string;
        title: string;
        description: string;
        icon: React.FC<any>;
        gradient: string;
        border: string;
        glow: string;
        iconColor: string;
        details: string;
    };
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className={`p-8 rounded-2xl bg-gradient-to-b ${feature.gradient} border border-slate-800 transition-all duration-500 group hover:-translate-y-1 hover:shadow-2xl ${feature.border} ${feature.glow} flex flex-col`}>
            <div className={`w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white group-hover:text-teal-50 text-left">{feature.title}</h3>
            <p className="text-slate-400 leading-relaxed text-left text-sm mb-6">{feature.description}</p>

            {showDetails && (
                <div className="mb-6 p-4 bg-slate-950/50 rounded-lg border border-slate-800/50 animate-fade-in">
                    <p className="text-slate-300 text-sm">{feature.details}</p>
                </div>
            )}

            <button
                onClick={() => setShowDetails(!showDetails)}
                className={`mt-auto self-start text-sm font-medium ${feature.iconColor} hover:text-white transition-colors flex items-center gap-2`}
            >
                {showDetails ? 'Menos detalhes' : 'Saiba mais'}
                <span className="text-lg">→</span>
            </button>
        </div>
    );
};
