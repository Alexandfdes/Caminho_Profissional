import React from 'react';
import { CVData } from '../../utils/cvParser';

interface CVPreviewProps {
    data: CVData;
}

export const CVPreview: React.FC<CVPreviewProps> = ({ data }) => {
    return (
        <div className="bg-white p-8 shadow-lg rounded-lg border border-gray-200 min-h-[800px]">
            <div className="mb-6 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.nome || 'Seu Nome'}</h1>
                <div className="text-gray-600 flex flex-wrap gap-4 text-sm">
                    {data.email && <span>📧 {data.email}</span>}
                    {data.telefone && <span>📱 {data.telefone}</span>}
                    {data.linkedin && <span>🔗 {data.linkedin}</span>}
                </div>
            </div>

            {data.resumo && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 border-b border-gray-100 pb-1">Resumo Profissional</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{data.resumo}</p>
                </div>
            )}

            {data.habilidades && data.habilidades.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 border-b border-gray-100 pb-1">Habilidades</h2>
                    <div className="flex flex-wrap gap-2">
                        {data.habilidades.map((skill, index) => (
                            <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {data.experiencias && data.experiencias.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 border-b border-gray-100 pb-1">Experiência Profissional</h2>
                    <div className="space-y-4">
                        {data.experiencias.map((exp, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-bold text-gray-800">{exp.cargo}</h3>
                                    <span className="text-sm text-gray-500">{exp.inicio} - {exp.fim}</span>
                                </div>
                                <div className="text-gray-600 font-medium mb-1">{exp.empresa}</div>
                                <p className="text-gray-700 text-sm whitespace-pre-wrap">{exp.descricao}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.formacao && data.formacao.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 border-b border-gray-100 pb-1">Formação Acadêmica</h2>
                    <div className="space-y-3">
                        {data.formacao.map((edu, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-bold text-gray-800">{edu.curso}</h3>
                                    <span className="text-sm text-gray-500">{edu.inicio} - {edu.fim}</span>
                                </div>
                                <div className="text-gray-600">{edu.instituicao}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
