import React from 'react';
import { RefreshCw, FileText, X } from 'lucide-react';

interface SyncBannerProps {
    onSync: () => void;
    onDismiss: () => void;
    onViewDiff: () => void;
}

export const SyncBanner: React.FC<SyncBannerProps> = ({ onSync, onDismiss, onViewDiff }) => {
    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-[color:var(--cv-surface)] border border-[color:var(--cv-border-weak)] rounded-xl shadow-[var(--cv-shadow-2)] p-4">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-[var(--cv-accent-a18)] rounded-lg shrink-0 border border-[color:var(--cv-border-weak)]">
                        <FileText className="w-5 h-5 text-[color:var(--cv-accent)]" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-[color:var(--cv-text)] mb-1">Dados do upload disponíveis</h3>
                        <p className="text-xs text-[color:var(--cv-muted)] mb-3 leading-[1.6]">
                            Encontramos um currículo processado. Deseja sincronizar o formulário com estes dados?
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onSync}
                                className="px-3 py-1.5 bg-[color:var(--cv-accent)] hover:bg-[color:var(--cv-accent-hover)] text-[#0B1220] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Sincronizar
                            </button>
                            <button
                                onClick={onViewDiff}
                                className="px-3 py-1.5 bg-[var(--cv-surface-a85)] hover:bg-[color:var(--cv-surface)] text-[color:var(--cv-text)] text-xs font-medium rounded-lg transition-colors border border-[color:var(--cv-border-weak)]"
                            >
                                Ver Diferenças
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-[color:var(--cv-muted)] hover:text-[color:var(--cv-text)] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
