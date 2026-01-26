import React, { forwardRef } from 'react';
import { Mail, MapPin, Globe, Phone } from 'lucide-react';
import { ResumeData } from '../types/resume';

export type ResumeHtmlPreviewProps = {
    resumeData: ResumeData;
    scale?: number;
};

export const ResumeHtmlPreview = forwardRef<HTMLDivElement, ResumeHtmlPreviewProps>(({ resumeData, scale = 1 }, ref) => {
    return (
        <div className="flex w-full justify-center overflow-hidden bg-slate-900/40 p-8 rounded-3xl">
            <div
                ref={ref}
                className="origin-top bg-white shadow-2xl"
                style={{
                    width: '210mm',
                    minHeight: '297mm',
                    height: '297mm', // Enforce A4 height for consistency
                    transform: `scale(${scale})`,
                    marginBottom: `calc(297mm * ${scale - 1})` // Adjust margin to avoid empty space below when scaled down
                }}
            >
                <div className="flex h-full w-full">
                    {/* Sidebar */}
                    <aside className="flex w-[32%] flex-col gap-8 bg-slate-900 px-6 py-8 text-white print:bg-slate-900 print:text-white">
                        {/* Contact Info */}
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400 mb-4 border-b border-slate-700 pb-2">
                                Contato
                            </h2>
                            <div className="space-y-3 text-[13px] leading-relaxed text-slate-300">
                                {resumeData.personalInfo.contact.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                                        <span>{resumeData.personalInfo.contact.phone}</span>
                                    </div>
                                )}
                                {resumeData.personalInfo.contact.email && (
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                                        <span className="break-all">{resumeData.personalInfo.contact.email}</span>
                                    </div>
                                )}
                                {resumeData.personalInfo.contact.location && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                                        <span>{resumeData.personalInfo.contact.location}</span>
                                    </div>
                                )}
                                {resumeData.personalInfo.contact.website && (
                                    <div className="flex items-start gap-3">
                                        <Globe className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                                        <span className="break-all">{resumeData.personalInfo.contact.website}</span>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Skills */}
                        {resumeData.skills.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400 mb-4 border-b border-slate-700 pb-2">
                                    Competências
                                </h2>
                                <ul className="flex flex-wrap gap-2">
                                    {resumeData.skills.map((skill, idx) => (
                                        <li key={`skill-${idx}`} className="bg-slate-800 px-2 py-1 rounded text-[12px] text-slate-200">
                                            {skill}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Education */}
                        {resumeData.education.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400 mb-4 border-b border-slate-700 pb-2">
                                    Formação
                                </h2>
                                <div className="space-y-4">
                                    {resumeData.education.map((edu, idx) => (
                                        <div key={`edu-${idx}`}>
                                            <p className="font-bold text-sm text-white">{edu.degree}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{edu.institution}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{edu.period}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 px-8 py-8 text-slate-900 bg-white">
                        {/* Header */}
                        <header className="border-b-2 border-slate-100 pb-6 mb-6">
                            <h1 className="text-4xl font-bold uppercase tracking-tight text-slate-900 leading-none">
                                {resumeData.personalInfo.name}
                            </h1>
                            <p className="text-lg font-medium text-teal-600 mt-2 tracking-wide">
                                {resumeData.personalInfo.role}
                            </p>
                        </header>

                        {/* Summary */}
                        {resumeData.summary && (
                            <section className="mb-8">
                                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
                                    Resumo Profissional
                                </h2>
                                <p className="text-sm leading-relaxed text-slate-700 text-justify">
                                    {resumeData.summary}
                                </p>
                            </section>
                        )}

                        {/* Experience */}
                        {resumeData.experiences.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">
                                    Experiência Profissional
                                </h2>
                                <div className="space-y-6">
                                    {resumeData.experiences.map((exp, idx) => (
                                        <article key={`exp-${idx}`} className="relative pl-4 border-l-2 border-slate-100">
                                            <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-200 border-2 border-white"></div>
                                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                                                <h3 className="text-base font-bold text-slate-900">{exp.role}</h3>
                                                <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                                                    {exp.period}
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold text-teal-700 mb-2">{exp.company}</p>
                                            <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                                                {exp.description}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
});

ResumeHtmlPreview.displayName = 'ResumeHtmlPreview';
