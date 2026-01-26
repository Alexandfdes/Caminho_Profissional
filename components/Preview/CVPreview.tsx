import React, { useState, useEffect, useMemo, forwardRef, memo, useRef } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, Download, ZoomIn, ZoomOut, Eye } from 'lucide-react';
import { useResumeStore } from '../../stores/resumeStore';
import { ResumeDocument } from './ResumeDocument';
import { clsx } from 'clsx';
import { EditableCV } from '../../types/cv';

// Configuração do Worker (Obrigatório)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// ============================================================================
// 1. O MOTOR DE DOUBLE-BUFFERING (A SOLUÇÃO DEFINITIVA)
// ============================================================================
interface IsolatedViewerProps {
    data: EditableCV;
    scale: number;
}

const IsolatedPDFViewer = memo(({ data, scale }: IsolatedViewerProps) => {
    // 1. Geração do Blob PDF (Background)
    const MyDoc = useMemo(() => <ResumeDocument data={data} />, [data]);
    const [instance, updateInstance] = usePDF({ document: MyDoc });

    // 2. Estado de Camadas (Buffer)
    // Mantemos a URL que está ATUALMENTE sendo exibida com sucesso
    const [visibleUrl, setVisibleUrl] = useState<string | null>(null);
    // Mantemos a URL que está "carregando" em segundo plano
    const [bufferUrl, setBufferUrl] = useState<string | null>(null);
    // Flag de que o documento no buffer já terminou de desenhar o canvas
    const [isBufferReady, setIsBufferReady] = useState(false);

    // Sincroniza o usePDF quando o dado mudar (após debounce do pai)
    useEffect(() => {
        updateInstance(MyDoc);
    }, [data, MyDoc, updateInstance]);

    // Quando o usePDF termina de gerar o binário...
    useEffect(() => {
        if (!instance.loading && instance.url) {
            // Se não temos nada visível, vamos direto para o visível
            if (!visibleUrl) {
                setVisibleUrl(instance.url);
            } else if (instance.url !== visibleUrl) {
                // Se já temos algo, colocamos a nova versão no buffer "escuro"
                setBufferUrl(instance.url);
                setIsBufferReady(false);
            }
        }
    }, [instance.loading, instance.url, visibleUrl]);

    // Troca as camadas assim que o buffer estiver desenhado
    useEffect(() => {
        if (isBufferReady && bufferUrl) {
            setVisibleUrl(bufferUrl);
            setBufferUrl(null);
            setIsBufferReady(false);
        }
    }, [isBufferReady, bufferUrl]);

    return (
        <div className="flex flex-col h-full relative overflow-hidden bg-[#0f0f0f]">
            {/* INDICADOR DE CARREGAMENTO (Discreto) */}
            {(instance.loading || bufferUrl) && (
                <div className="absolute top-4 right-4 z-40 bg-gray-900/80 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-xl pointer-events-none">
                    <Loader2 size={12} className="animate-spin text-teal-500" />
                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Sincronizando</span>
                </div>
            )}

            <div className="flex-1 w-full overflow-auto flex justify-center scrollbar-hide select-none transition-colors duration-500 bg-white">
                <div className="relative h-fit">
                    {/* CAMADA 1: O QUE O USUÁRIO VÊ AGORA */}
                    {visibleUrl && (
                        <div className={clsx(
                            "relative z-10 shadow-sm", // Sombras mais leves sem a borda preta
                            bufferUrl && "opacity-100"
                        )}>
                            <Document
                                file={visibleUrl}
                                loading={null}
                                className="bg-white"
                            >
                                <Page
                                    pageNumber={1}
                                    scale={scale}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    className="bg-white"
                                />
                            </Document>
                        </div>
                    )}

                    {/* CAMADA 2: O BUFFER (HIDDEN) */}
                    {bufferUrl && (
                        <div className="absolute top-0 left-0 z-0 opacity-0 pointer-events-none">
                            <Document
                                file={bufferUrl}
                                loading={null}
                            >
                                <Page
                                    pageNumber={1}
                                    scale={scale}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    onRenderSuccess={() => setIsBufferReady(true)}
                                />
                            </Document>
                        </div>
                    )}

                    {!visibleUrl && (
                        <div className="flex flex-col items-center justify-center mt-32 gap-4 text-gray-400">
                            <Loader2 size={40} className="animate-spin text-teal-600/30" />
                            <p className="text-sm italic font-medium">Renderizando...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    // Memorização pesada: evitamos re-render se o dado processado for o mesmo
    return JSON.stringify(prev.data) === JSON.stringify(next.data) && prev.scale === next.scale;
});

IsolatedPDFViewer.displayName = 'IsolatedPDFViewer';

// ============================================================================
// 2. COMPONENTE PRINCIPAL (TRATAMENTO DE DADOS E DEBOUNCE)
// ============================================================================
interface CVPreviewProps {
    scaleOverride?: number;
    previewMode?: 'light' | 'dark';
    paperRounded?: boolean;
    paperShadow?: boolean;
}

export const CVPreview = memo(forwardRef<HTMLDivElement, CVPreviewProps>((props, ref) => {
    const { scaleOverride } = props;
    const rawData = useResumeStore((state) => state.cvData);
    const [scale, setScale] = useState(scaleOverride || 1.1);

    useEffect(() => {
        if (scaleOverride !== undefined) setScale(scaleOverride);
    }, [scaleOverride]);

    // 1. HIGIENE DE DADOS: Isola apenas o que compõe o PDF
    const pdfData = useMemo(() => {
        if (!rawData) return null;
        return {
            ...rawData,
            sections: rawData.sections.map(s => {
                // Remove propriedades de UI (collapsed) para que mudanças visuais no editor
                // não gerem novas URLs de PDF e causem flicker.
                const { collapsed, ...pdfProps } = s;
                return { ...pdfProps, collapsed: false };
            })
        } as EditableCV;
    }, [JSON.stringify(rawData)]);

    // 2. DEBOUNCE INTELIGENTE: 1200ms
    // Um pouco maior para garantir que o usuário terminou o "pensamento" de digitação
    const [debouncedData, setDebouncedData] = useState(pdfData);
    useEffect(() => {
        if (!pdfData) return;
        if (JSON.stringify(pdfData) === JSON.stringify(debouncedData)) return;

        const handler = setTimeout(() => {
            setDebouncedData(pdfData);
        }, 1200);
        return () => clearTimeout(handler);
    }, [pdfData, debouncedData]);

    if (!debouncedData) return null;

    return (
        <div ref={ref} className="h-full w-full bg-[#1a1a1a] flex flex-col overflow-hidden shadow-inner">
            {/* Toolbar Profissional */}
            <div className="h-12 bg-[#252525] border-b border-white/5 flex items-center justify-between px-4 z-30 shadow-xl">
                <div className="flex items-center gap-2">
                    <Eye size={16} className="text-teal-500" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Visualizador de Documento</span>
                </div>

                <div className="flex items-center gap-3 bg-black/30 rounded-lg p-1 px-3 border border-white/5">
                    <button onClick={() => setScale(s => Math.max(0.4, s - 0.1))} className="text-gray-500 hover:text-white transition"><ZoomOut size={16} /></button>
                    <span className="text-[11px] font-mono text-gray-400 w-10 text-center font-bold">{(scale * 100).toFixed(0)}%</span>
                    <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="text-gray-500 hover:text-white transition"><ZoomIn size={16} /></button>
                </div>
                <div className="w-24" />
            </div>

            <IsolatedPDFViewer data={debouncedData} scale={scale} />
        </div>
    );
}));

CVPreview.displayName = 'CVPreview';
