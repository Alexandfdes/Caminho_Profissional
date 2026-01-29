import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CVData, Experience, Education, extractTextFromDOCX } from '../../utils/cvParser';
import { Loader2, Upload, AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { autofillCVWithAI } from '../../services/geminiService';
import { pdfParserService } from '../../services/pdfParserService';

interface CVImportFormProps {
    data: CVData;
    onUpdate: (data: CVData) => void;
}

export const CVImportForm: React.FC<CVImportFormProps> = ({ data, onUpdate }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const stripHtml = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    const parseDateRange = (dateStr: string) => {
        if (!dateStr) return { inicio: '', fim: '' };
        const parts = dateStr.split(/\s+[-–—]\s+/);
        return {
            inicio: parts[0]?.trim() || '',
            fim: parts[1]?.trim() || ''
        };
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setSuccessMsg(null);

        try {
            let extractedText = '';
            let images: string[] | undefined = undefined;
            const fileName = file.name.toLowerCase();

            // 1. Extraction based on format
            if (fileName.endsWith('.docx')) {
                extractedText = await extractTextFromDOCX(file);
            } else if (fileName.endsWith('.pdf')) {
                extractedText = await pdfParserService.extractTextFromPDF(file);

                // 2. Fallback for scanned PDFs (image-only)
                if (!extractedText || extractedText.trim().length < 100) {
                    console.log('🔍 [CVImportForm] Texto insuficiente detetado no PDF. Tentando OCR (Visual)...');
                    images = await pdfParserService.convertPDFToImages(file, 3);
                }
            } else {
                throw new Error('Formato de arquivo não suportado. Use PDF ou DOCX.');
            }

            // 3. Call AI Service
            const result = await autofillCVWithAI({
                text: extractedText,
                images: images,
                filename: file.name
            });

            if (!result || !result.patch) {
                throw new Error('Falha ao interpretar os dados do currículo.');
            }

            // 4. Map to local state structure (CVData)
            const patch = result.patch;
            const mappedData: CVData = {
                nome: patch.personal.fullName || '',
                email: patch.personal.email || '',
                telefone: patch.personal.phone || '',
                linkedin: patch.personal.linkedin || '',
                resumo: stripHtml(patch.summaryHtml || ''),
                habilidades: Array.isArray(patch.skills) ? patch.skills : [],
                experiencias: (patch.experience || []).map(exp => {
                    const { inicio, fim } = parseDateRange(exp.date);
                    return {
                        empresa: exp.subtitle || '',
                        cargo: exp.title || '',
                        inicio,
                        fim,
                        descricao: stripHtml(exp.descriptionHtml || '')
                    };
                }),
                formacao: (patch.education || []).map(edu => {
                    const { inicio, fim } = parseDateRange(edu.date);
                    return {
                        instituicao: edu.subtitle || '',
                        curso: edu.title || '',
                        inicio,
                        fim
                    };
                })
            };

            onUpdate(mappedData);
            setSuccessMsg('Currículo importado com sucesso pela nossa IA! Revise os dados abaixo.');

            if (result.warnings && result.warnings.length > 0) {
                console.warn('AI Warnings:', result.warnings);
            }

        } catch (err: any) {
            console.error('Error importing CV:', err);
            setError(err.message || 'Falha ao processar o arquivo. Tente novamente ou use outro arquivo.');
        } finally {
            setIsProcessing(false);
        }
    }, [onUpdate]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024 // 5MB
    });

    const handleChange = (field: keyof CVData, value: any) => {
        onUpdate({ ...data, [field]: value });
    };

    const handleExperienceChange = (index: number, field: keyof Experience, value: string) => {
        const newExp = [...data.experiencias];
        newExp[index] = { ...newExp[index], [field]: value };
        onUpdate({ ...data, experiencias: newExp });
    };

    const addExperience = () => {
        onUpdate({
            ...data,
            experiencias: [...data.experiencias, { empresa: '', cargo: '', inicio: '', fim: '', descricao: '' }]
        });
    };

    const removeExperience = (index: number) => {
        const newExp = data.experiencias.filter((_, i) => i !== index);
        onUpdate({ ...data, experiencias: newExp });
    };

    const handleEducationChange = (index: number, field: keyof Education, value: string) => {
        const newEdu = [...data.formacao];
        newEdu[index] = { ...newEdu[index], [field]: value };
        onUpdate({ ...data, formacao: newEdu });
    };

    const addEducation = () => {
        onUpdate({
            ...data,
            formacao: [...data.formacao, { instituicao: '', curso: '', inicio: '', fim: '' }]
        });
    };

    const removeEducation = (index: number) => {
        const newEdu = data.formacao.filter((_, i) => i !== index);
        onUpdate({ ...data, formacao: newEdu });
    };

    return (
        <div className="space-y-6">
            {/* Upload Zone */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${successMsg ? 'border-green-300 bg-green-50' : ''}
        `}
            >
                <input {...getInputProps()} />
                {isProcessing ? (
                    <div className="flex flex-col items-center justify-center text-gray-600">
                        <Loader2 className="w-10 h-10 animate-spin mb-2 text-blue-600" />
                        <p>Processando seu currículo...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-600">
                        <Upload className="w-10 h-10 mb-2 text-gray-400" />
                        <p className="font-medium">Arraste e solte seu currículo (PDF ou DOCX)</p>
                        <p className="text-sm text-gray-400 mt-1">ou clique para selecionar (máx 5MB)</p>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    {successMsg}
                </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                        <input
                            type="text"
                            value={data.nome}
                            onChange={e => handleChange('nome', e.target.value)}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => handleChange('email', e.target.value)}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                        <input
                            type="text"
                            value={data.telefone}
                            onChange={e => handleChange('telefone', e.target.value)}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                        <input
                            type="text"
                            value={data.linkedin}
                            onChange={e => handleChange('linkedin', e.target.value)}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resumo Profissional</label>
                    <textarea
                        rows={4}
                        value={data.resumo}
                        onChange={e => handleChange('resumo', e.target.value)}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Habilidades (separadas por vírgula)</label>
                    <input
                        type="text"
                        value={data.habilidades.join(', ')}
                        onChange={e => handleChange('habilidades', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ex: React, TypeScript, Node.js"
                    />
                </div>

                {/* Experiências */}
                <div className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Experiência Profissional</h3>
                        <button
                            onClick={addExperience}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <Plus className="w-4 h-4" /> Adicionar
                        </button>
                    </div>

                    <div className="space-y-6">
                        {data.experiencias.map((exp, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-lg border relative group">
                                <button
                                    onClick={() => removeExperience(idx)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remover"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Empresa</label>
                                        <input
                                            value={exp.empresa}
                                            onChange={e => handleExperienceChange(idx, 'empresa', e.target.value)}
                                            className="w-full p-2 border rounded bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Cargo</label>
                                        <input
                                            value={exp.cargo}
                                            onChange={e => handleExperienceChange(idx, 'cargo', e.target.value)}
                                            className="w-full p-2 border rounded bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Início</label>
                                        <input
                                            value={exp.inicio}
                                            onChange={e => handleExperienceChange(idx, 'inicio', e.target.value)}
                                            className="w-full p-2 border rounded bg-white"
                                            placeholder="Ex: Jan 2020"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Fim</label>
                                        <input
                                            value={exp.fim}
                                            onChange={e => handleExperienceChange(idx, 'fim', e.target.value)}
                                            className="w-full p-2 border rounded bg-white"
                                            placeholder="Ex: Atual"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Descrição</label>
                                    <textarea
                                        rows={3}
                                        value={exp.descricao}
                                        onChange={e => handleExperienceChange(idx, 'descricao', e.target.value)}
                                        className="w-full p-2 border rounded bg-white"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Formação */}
                <div className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Formação Acadêmica</h3>
                        <button
                            onClick={addEducation}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <Plus className="w-4 h-4" /> Adicionar
                        </button>
                    </div>

                    <div className="space-y-4">
                        {data.formacao.map((edu, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-lg border relative group">
                                <button
                                    onClick={() => removeEducation(idx)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remover"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Instituição</label>
                                        <input
                                            value={edu.instituicao}
                                            onChange={e => handleEducationChange(idx, 'instituicao', e.target.value)}
                                            className="w-full p-2 border rounded bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Curso</label>
                                        <input
                                            value={edu.curso}
                                            onChange={e => handleEducationChange(idx, 'curso', e.target.value)}
                                            className="w-full p-2 border rounded bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Início</label>
                                        <input
                                            value={edu.inicio}
                                            onChange={e => handleEducationChange(idx, 'inicio', e.target.value)}
                                            className="w-full p-2 border rounded bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Fim</label>
                                        <input
                                            value={edu.fim}
                                            onChange={e => handleEducationChange(idx, 'fim', e.target.value)}
                                            className="w-full p-2 border rounded bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
