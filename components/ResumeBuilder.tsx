import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Info, Plus, Trash2, HelpCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { ResumeHtmlPreview } from './ResumeHtmlPreview';
import { ResumeData } from '../types/resume';

const initialResumeData: ResumeData = {
    personalInfo: {
        name: 'Alexandra Fernandes',
        role: 'Product Designer',
        photo: '',
        contact: {
            phone: '+55 (11) 99999-9999',
            email: 'alexandra@email.com',
            location: 'São Paulo, SP',
            website: 'linkedin.com/in/alexandra'
        }
    },
    summary: 'Profissional focada em criar experiências digitais centradas no usuário. Experiência com pesquisa qualitativa, design systems e facilitação de workshops.',
    experiences: [
        {
            company: 'TechWave',
            role: 'Senior Product Designer',
            period: '2021 - Atual',
            description: 'Condução de discovery contínuo, evolução do design system e liderança de squads de pagamento.'
        }
    ],
    education: [
        {
            institution: 'USP',
            degree: 'Bacharel em Design',
            period: '2014 - 2018'
        }
    ],
    skills: ['Product Discovery', 'Design System', 'User Research', 'UX Writing', 'Figma']
};

const inputClasses = 'w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all';
const labelClasses = 'flex items-center gap-2 text-xs font-medium text-slate-300 mb-1.5';

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="group relative inline-flex items-center justify-center">
        <HelpCircle className="h-3.5 w-3.5 text-slate-500 hover:text-teal-400 cursor-help transition-colors" />
        <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-200 shadow-xl ring-1 ring-slate-700 group-hover:block z-50">
            {text}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>
    </div>
);

export const ResumeBuilder: React.FC = () => {
    const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
    const [scale, setScale] = useState(1);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const printContentRef = useRef<HTMLDivElement>(null);

    const updatePersonalInfo = (field: keyof typeof initialResumeData.personalInfo, value: string) => {
        setResumeData(prev => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, [field]: value }
        }));
    };

    const updateContact = (field: keyof typeof initialResumeData.personalInfo.contact, value: string) => {
        setResumeData(prev => ({
            ...prev,
            personalInfo: {
                ...prev.personalInfo,
                contact: { ...prev.personalInfo.contact, [field]: value }
            }
        }));
    };

    const updateSummary = (value: string) => {
        setResumeData(prev => ({ ...prev, summary: value }));
    };

    const updateArrayField = (
        key: 'experiences' | 'education' | 'skills',
        index: number,
        field: string,
        value: string
    ) => {
        setResumeData(prev => {
            const copy = [...(prev[key] as any[])];
            copy[index] = key === 'skills' ? value : { ...copy[index], [field]: value };
            return { ...prev, [key]: copy };
        });
    };

    const addItem = (key: 'experiences' | 'education' | 'skills') => {
        setResumeData(prev => {
            const copy = [...(prev[key] as any[])];
            if (key === 'experiences') {
                copy.push({ company: '', role: '', period: '', description: '' });
            } else if (key === 'education') {
                copy.push({ institution: '', degree: '', period: '' });
            } else {
                copy.push('');
            }
            return { ...prev, [key]: copy };
        });
    };

    const removeItem = (key: 'experiences' | 'education' | 'skills', idx: number) => {
        setResumeData(prev => {
            const copy = [...(prev[key] as any[])];
            copy.splice(idx, 1);
            return { ...prev, [key]: copy };
        });
    };

    const handleDownloadPdf = useReactToPrint({
        contentRef: printContentRef,
        documentTitle: `Curriculo_${resumeData.personalInfo.name.replace(/\s+/g, '_')}`,
    });

    useEffect(() => {
        const updateScale = () => {
            if (!previewContainerRef.current) return;
            const availableWidth = previewContainerRef.current.clientWidth;
            // 210mm in pixels at 96dpi is approx 794px. 
            // We add some padding (e.g. 48px for p-6 * 2) to calculation if needed, 
            // but here we measure the container itself.
            // Let's assume the preview takes full width of container minus padding.
            const targetWidth = 794;
            const padding = 48; // p-6 is 24px, so 48px total horizontal padding
            const usableWidth = availableWidth - padding;

            if (usableWidth <= 0) return;

            const nextScale = Math.min(usableWidth / targetWidth, 1);
            setScale(Number(nextScale.toFixed(2)));
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Resume Builder</h1>
                        <p className="text-xs text-slate-400">Edição em tempo real • Alta Performance</p>
                    </div>
                    <button
                        onClick={() => handleDownloadPdf()}
                        className="group inline-flex items-center gap-2 rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:bg-teal-400 hover:shadow-teal-500/30 active:scale-95"
                    >
                        <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                        Baixar PDF
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-hidden">
                <div className="mx-auto flex h-full max-w-7xl flex-col lg:flex-row">
                    {/* Form Column - Scrollable */}
                    <section className="flex-1 overflow-y-auto p-6 lg:h-[calc(100vh-80px)] scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
                        <div className="space-y-8 max-w-2xl mx-auto pb-20">

                            {/* Personal Info */}
                            <section className="space-y-4">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-2">
                                    Dados Pessoais
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className={labelClasses}>
                                            Nome Completo
                                            <Tooltip text="Seu nome como deve aparecer no topo do currículo." />
                                        </label>
                                        <input
                                            className={inputClasses}
                                            value={resumeData.personalInfo.name}
                                            onChange={e => updatePersonalInfo('name', e.target.value)}
                                            placeholder="Ex: Alexandra Fernandes"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelClasses}>
                                            Cargo / Título
                                            <Tooltip text="O cargo que você ocupa ou almeja." />
                                        </label>
                                        <input
                                            className={inputClasses}
                                            value={resumeData.personalInfo.role}
                                            onChange={e => updatePersonalInfo('role', e.target.value)}
                                            placeholder="Ex: Product Designer"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Telefone</label>
                                        <input
                                            className={inputClasses}
                                            value={resumeData.personalInfo.contact.phone}
                                            onChange={e => updateContact('phone', e.target.value)}
                                            placeholder="+55 (11) 99999-9999"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>E-mail</label>
                                        <input
                                            className={inputClasses}
                                            value={resumeData.personalInfo.contact.email}
                                            onChange={e => updateContact('email', e.target.value)}
                                            placeholder="email@exemplo.com"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Localização</label>
                                        <input
                                            className={inputClasses}
                                            value={resumeData.personalInfo.contact.location}
                                            onChange={e => updateContact('location', e.target.value)}
                                            placeholder="Cidade, Estado"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Link (LinkedIn/Portfólio)</label>
                                        <input
                                            className={inputClasses}
                                            value={resumeData.personalInfo.contact.website}
                                            onChange={e => updateContact('website', e.target.value)}
                                            placeholder="linkedin.com/in/seu-perfil"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Summary */}
                            <section className="space-y-4">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-2">
                                    Resumo
                                </h2>
                                <div>
                                    <label className={labelClasses}>
                                        Resumo Profissional
                                        <Tooltip text="Breve descrição de suas principais qualificações e objetivos." />
                                    </label>
                                    <textarea
                                        className={`${inputClasses} min-h-[120px] resize-y`}
                                        value={resumeData.summary}
                                        onChange={e => updateSummary(e.target.value)}
                                        placeholder="Resuma sua experiência e principais conquistas..."
                                    />
                                </div>
                            </section>

                            {/* Experience */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400">
                                        Experiência
                                    </h2>
                                    <button
                                        onClick={() => addItem('experiences')}
                                        className="flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> ADICIONAR
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    {resumeData.experiences.map((exp, idx) => (
                                        <div key={idx} className="relative rounded-xl border border-slate-800 bg-slate-900/30 p-4 transition-all hover:border-slate-700">
                                            <div className="mb-4 grid gap-4 sm:grid-cols-2">
                                                <div className="sm:col-span-2">
                                                    <input
                                                        className={inputClasses}
                                                        value={exp.company}
                                                        onChange={e => updateArrayField('experiences', idx, 'company', e.target.value)}
                                                        placeholder="Empresa"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        className={inputClasses}
                                                        value={exp.role}
                                                        onChange={e => updateArrayField('experiences', idx, 'role', e.target.value)}
                                                        placeholder="Cargo"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        className={inputClasses}
                                                        value={exp.period}
                                                        onChange={e => updateArrayField('experiences', idx, 'period', e.target.value)}
                                                        placeholder="Período (ex: 2020 - Atual)"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <textarea
                                                        className={`${inputClasses} min-h-[100px]`}
                                                        value={exp.description}
                                                        onChange={e => updateArrayField('experiences', idx, 'description', e.target.value)}
                                                        placeholder="Principais responsabilidades e conquistas..."
                                                    />
                                                </div>
                                            </div>
                                            {resumeData.experiences.length > 1 && (
                                                <button
                                                    onClick={() => removeItem('experiences', idx)}
                                                    className="absolute -right-2 -top-2 rounded-full bg-slate-800 p-1.5 text-rose-400 shadow-sm hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                                                    title="Remover experiência"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Education */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400">
                                        Educação
                                    </h2>
                                    <button
                                        onClick={() => addItem('education')}
                                        className="flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> ADICIONAR
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {resumeData.education.map((edu, idx) => (
                                        <div key={idx} className="relative rounded-xl border border-slate-800 bg-slate-900/30 p-4 transition-all hover:border-slate-700">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="sm:col-span-2">
                                                    <input
                                                        className={inputClasses}
                                                        value={edu.institution}
                                                        onChange={e => updateArrayField('education', idx, 'institution', e.target.value)}
                                                        placeholder="Instituição de Ensino"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        className={inputClasses}
                                                        value={edu.degree}
                                                        onChange={e => updateArrayField('education', idx, 'degree', e.target.value)}
                                                        placeholder="Grau / Curso"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        className={inputClasses}
                                                        value={edu.period}
                                                        onChange={e => updateArrayField('education', idx, 'period', e.target.value)}
                                                        placeholder="Ano de Conclusão"
                                                    />
                                                </div>
                                            </div>
                                            {resumeData.education.length > 1 && (
                                                <button
                                                    onClick={() => removeItem('education', idx)}
                                                    className="absolute -right-2 -top-2 rounded-full bg-slate-800 p-1.5 text-rose-400 shadow-sm hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                                                    title="Remover educação"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Skills */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400">
                                        Competências
                                    </h2>
                                    <button
                                        onClick={() => addItem('skills')}
                                        className="flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> ADICIONAR
                                    </button>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {resumeData.skills.map((skill, idx) => (
                                        <div key={idx} className="relative flex items-center">
                                            <input
                                                className={inputClasses}
                                                value={skill}
                                                onChange={e => updateArrayField('skills', idx, '', e.target.value)}
                                                placeholder="Ex: Liderança, Figma..."
                                            />
                                            {resumeData.skills.length > 1 && (
                                                <button
                                                    onClick={() => removeItem('skills', idx)}
                                                    className="absolute right-2 p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                        </div>
                    </section>

                    {/* Preview Column - Sticky */}
                    <section className="hidden lg:block lg:w-1/2 bg-slate-950 border-l border-slate-800 relative" ref={previewContainerRef}>
                        <div className="sticky top-0 h-full flex items-center justify-center p-8 overflow-hidden">
                            <ResumeHtmlPreview ref={printContentRef} resumeData={resumeData} scale={scale} />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
