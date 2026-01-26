import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RotateCcw, Sparkles, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { ImproveRichTextContext, improveRichTextHTML } from '../../services/richTextImproveService';
import { isRichTextEmpty, normalizeRichTextHtml } from '../../utils/richTextAdapter';

export type ImproveTextButtonProps = {
  getHtml: () => string;
  setHtml: (next: string) => void;
  context: ImproveRichTextContext;
  /** Current HTML (used to invalidate undo when user edits). */
  currentHtml: string;
};

const UNDO_TTL_MS = 60_000;
const MIN_CLICK_INTERVAL_MS = 3_000;

export function ImproveTextButton(props: ImproveTextButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  const undoRef = useRef<{ prevHtml: string; appliedHtml: string; expiresAt: number } | null>(null);
  const lastClickAtRef = useRef<number>(0);

  const normalizedCurrent = useMemo(() => normalizeRichTextHtml(props.currentHtml), [props.currentHtml]);

  const disabledReason = useMemo(() => {
    if (isLoading) return 'Melhorando…';
    if (isRichTextEmpty(normalizedCurrent)) return 'Digite um texto primeiro';
    return null;
  }, [isLoading, normalizedCurrent]);

  useEffect(() => {
    // Invalidate undo when user edits after applying.
    const u = undoRef.current;
    if (!u) return;

    if (Date.now() > u.expiresAt) {
      undoRef.current = null;
      setCanUndo(false);
      return;
    }

    // If current differs from what we applied, assume user edited.
    if (normalizedCurrent.trim() && normalizedCurrent.trim() !== u.appliedHtml.trim()) {
      undoRef.current = null;
      setCanUndo(false);
    }
  }, [normalizedCurrent]);

  const improve = async () => {
    if (disabledReason) return;

    const now = Date.now();
    if (now - lastClickAtRef.current < MIN_CLICK_INTERVAL_MS) return;
    lastClickAtRef.current = now;

    setError(null);
    setIsLoading(true);

    const prevHtml = normalizeRichTextHtml(props.getHtml());

    try {
      const { html: improved } = await improveRichTextHTML({
        html: prevHtml,
        context: props.context,
      });

      const next = normalizeRichTextHtml(improved);
      props.setHtml(next);

      undoRef.current = {
        prevHtml,
        appliedHtml: next,
        expiresAt: Date.now() + UNDO_TTL_MS,
      };
      setCanUndo(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao melhorar texto com IA.';
      setError(msg);
      setCanUndo(false);
      undoRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const undo = () => {
    const u = undoRef.current;
    if (!u) return;
    if (Date.now() > u.expiresAt) {
      undoRef.current = null;
      setCanUndo(false);
      return;
    }

    props.setHtml(u.prevHtml);
    undoRef.current = null;
    setCanUndo(false);
  };

  return (
    <div className="flex items-center gap-2">
      {error && (
        <div className="flex items-center gap-1 text-[11px] text-rose-300">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{error}</span>
          <button
            type="button"
            className="ml-1 underline hover:text-rose-200"
            onClick={improve}
            disabled={isLoading}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {canUndo && !error && (
        <button
          type="button"
          onClick={undo}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[color:var(--muted-text)] hover:text-[color:var(--input-text)] transition-colors px-2 py-1 rounded-md border border-[color:var(--input-border)] hover:border-[color:var(--input-border-hover)] hover:bg-white/5"
          title="Desfazer (disponível por 1 minuto)"
        >
          <RotateCcw className="w-3 h-3" />
          Desfazer
        </button>
      )}

      <button
        type="button"
        onClick={improve}
        disabled={!!disabledReason}
        className={clsx(
          'inline-flex items-center gap-1.5 text-[11px] font-semibold transition-colors px-2 py-1 rounded-md border',
          !!disabledReason
            ? 'opacity-50 cursor-not-allowed text-[color:var(--muted-text)] border-[color:var(--input-border)]'
            : 'text-[color:var(--muted-text)] hover:text-[color:var(--input-text)] border-[color:var(--input-border)] hover:border-[color:var(--input-border-hover)] hover:bg-white/5',
        )}
        title={disabledReason || 'Reescrever melhorando clareza e profissionalismo (sem inventar informações)'}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Melhorando…
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3" />
            Melhorar Texto
          </>
        )}
      </button>
    </div>
  );
}
