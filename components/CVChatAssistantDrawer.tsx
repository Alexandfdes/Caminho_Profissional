import React, { useEffect, useMemo, useState } from 'react';
import { X, Send, Sparkles, Wand2, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { invokeGeminiJson } from '../services/geminiService';
import { EditableCV, Section, SectionType } from '../types/cv';

type Patch =
  | {
      target: 'section';
      sectionType: SectionType;
      op: 'set_content';
      content: string;
    }
  | {
      target: 'section';
      sectionType: 'personal';
      op: 'set_fields';
      fields: Record<string, string | undefined>;
    }
  | {
      target: 'section';
      sectionType: 'list';
      op: 'set_list';
      list: string[];
    }
  | {
      target: 'item';
      sectionType: 'repeatable_group';
      sectionTitleHint?: 'Experiência' | 'Educação';
      index: number;
      op: 'set_item';
      item: {
        title?: string;
        subtitle?: string;
        date?: string;
        description?: string;
      };
    }
  | {
      target: 'item';
      sectionType: 'repeatable_group';
      sectionTitleHint?: 'Experiência' | 'Educação';
      op: 'add_item';
      item: {
        title?: string;
        subtitle?: string;
        date?: string;
        description?: string;
      };
    };

type AssistantResponse = {
  reply: string;
  patches?: Patch[];
  followupQuestions?: string[];
  warnings?: string[];
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  patches?: Patch[];
  followupQuestions?: string[];
  warnings?: string[];
  applied?: boolean;
};

type ConfirmField = {
  key: string;
  label: string;
  currentValue?: string;
  proposedValue?: string;
};

type ConfirmState = {
  messageId: string;
  patches: Patch[];
  fields: ConfirmField[];
  values: Record<string, string>;
};

function safeTrim(s: string, maxLen: number) {
  const str = String(s ?? '');
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

function buildCvContext(cvData: EditableCV) {
  const byType = new Map<SectionType, Section>();
  for (const s of cvData.sections) byType.set(s.type, s);

  const personal = byType.get('personal');
  const summary = byType.get('richtext');
  const skills = cvData.sections.find((s) => s.type === 'list' && /habil/i.test(s.title));
  const experience = cvData.sections.find((s) => s.type === 'repeatable_group' && /experi/i.test(s.title));
  const education = cvData.sections.find((s) => s.type === 'repeatable_group' && /(forma|educa)/i.test(s.title));

  const context = {
    personal: personal?.fields ?? {},
    summary: safeTrim(summary?.content ?? '', 1200),
    skills: (skills?.list ?? []).slice(0, 40),
    experience: (experience?.items ?? []).slice(0, 6).map((it) => ({
      title: safeTrim(it.title ?? '', 120),
      subtitle: safeTrim(it.subtitle ?? '', 120),
      date: safeTrim(it.date ?? '', 60),
      description: safeTrim(it.description ?? '', 900),
    })),
    education: (education?.items ?? []).slice(0, 6).map((it) => ({
      title: safeTrim(it.title ?? '', 120),
      subtitle: safeTrim(it.subtitle ?? '', 120),
      date: safeTrim(it.date ?? '', 60),
      description: safeTrim(it.description ?? '', 600),
    })),
  };

  return JSON.stringify(context);
}

function summarizePatch(p: Patch): string {
  if (p.target === 'section' && p.op === 'set_content') {
    return `Atualizar texto da seção (${p.sectionType})`;
  }
  if (p.target === 'section' && p.op === 'set_fields') {
    const keys = Object.keys(p.fields || {}).filter(Boolean);
    return `Atualizar dados pessoais: ${keys.slice(0, 4).join(', ')}${keys.length > 4 ? '…' : ''}`;
  }
  if (p.target === 'section' && p.op === 'set_list') {
    return `Atualizar lista de habilidades (${p.list?.length ?? 0} itens)`;
  }
  if (p.target === 'item' && p.op === 'set_item') {
    return `Atualizar item ${p.index + 1} em ${p.sectionTitleHint ?? 'seção de itens'}`;
  }
  if (p.target === 'item' && p.op === 'add_item') {
    return `Adicionar item em ${p.sectionTitleHint ?? 'seção de itens'}`;
  }
  return 'Atualização sugerida';
}

export const CVChatAssistantDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  cvData: EditableCV;
  onApplyPatches: (patches: Patch[]) => { applied: number; skipped: number };
}> = ({ open, onClose, cvData, onApplyPatches }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm0',
      role: 'assistant',
      content:
        'Me diga o que você quer melhorar (ex: “escreva um resumo”, “melhore minhas experiências”, “adapte para vaga X”). Eu vou sugerir mudanças e você escolhe aplicar.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [followupAnswersByMessage, setFollowupAnswersByMessage] = useState<Record<string, string[]>>({});

  const contextJson = useMemo(() => buildCvContext(cvData), [cvData]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const send = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setError(null);
    setIsSending(true);

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const prompt = `Você é um assistente especialista em currículos (PT-BR).

REGRAS IMPORTANTES:
- NÃO invente fatos (empresa, datas, cursos, números). Se faltar informação, faça perguntas em followupQuestions.
- Foque em clareza, ATS e impacto.
- Retorne APENAS JSON válido com esta estrutura:
{
  "reply": string,
  "patches": Patch[],
  "followupQuestions": string[],
  "warnings": string[]
}

Onde Patch é uma lista de operações permitidas:
1) Atualizar Resumo (richtext):
{ "target":"section", "sectionType":"richtext", "op":"set_content", "content": string }

2) Atualizar Dados Pessoais (personal):
{ "target":"section", "sectionType":"personal", "op":"set_fields", "fields": {"fullName"?:string,"role"?:string,"email"?:string,"phone"?:string,"location"?:string,"linkedin"?:string} }

3) Atualizar Habilidades (list):
{ "target":"section", "sectionType":"list", "op":"set_list", "list": string[] }

4) Atualizar um item existente de Experiência/Educação (repeatable_group) por índice:
{ "target":"item", "sectionType":"repeatable_group", "sectionTitleHint":"Experiência"|"Educação", "op":"set_item", "index": number, "item": {"title"?:string,"subtitle"?:string,"date"?:string,"description"?:string} }

5) Adicionar um item em Experiência/Educação:
{ "target":"item", "sectionType":"repeatable_group", "sectionTitleHint":"Experiência"|"Educação", "op":"add_item", "item": {"title"?:string,"subtitle"?:string,"date"?:string,"description"?:string} }

CONTEXTO ATUAL DO CURRÍCULO (JSON):
${contextJson}

PEDIDO DO USUÁRIO:
${text}
`;

      const resp = await invokeGeminiJson<AssistantResponse>({
        prompt,
        requestType: 'chat',
        temperature: 0.4,
        maxOutputTokens: 1400,
      });

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: String(resp?.reply ?? '').trim() || 'Ok. Posso sugerir melhorias — me diga em qual seção você quer focar.',
        patches: Array.isArray(resp?.patches) ? resp.patches : undefined,
        followupQuestions: Array.isArray(resp?.followupQuestions) ? resp.followupQuestions : undefined,
        warnings: Array.isArray(resp?.warnings) ? resp.warnings : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      setError(e?.message || 'Erro ao chamar a IA.');
    } finally {
      setIsSending(false);
    }
  };

  const generateFromFollowups = async (message: Message) => {
    if (!message.followupQuestions || message.followupQuestions.length === 0) return;
    if (isSending) return;

    const answers = followupAnswersByMessage[message.id] || [];
    const hasAny = answers.some((a) => String(a || '').trim().length > 0);
    if (!hasAny) {
      setError('Responda pelo menos uma pergunta antes de gerar sugestões.');
      return;
    }

    setError(null);
    setIsSending(true);
    try {
      const qa = message.followupQuestions
        .map((q, i) => {
          const a = String(answers[i] ?? '').trim();
          return `Q${i + 1}: ${q}\nA${i + 1}: ${a || '(sem resposta)'}`;
        })
        .join('\n\n');

      const prompt = `Você é um assistente especialista em currículos (PT-BR).

REGRAS IMPORTANTES:
- Use APENAS as respostas do usuário como fatos. NÃO invente dados.
- Se alguma resposta estiver vazia e for essencial, não crie patches para esse ponto; em vez disso, faça novas perguntas.
- Retorne APENAS JSON válido com esta estrutura:
{
  "reply": string,
  "patches": Patch[],
  "followupQuestions": string[],
  "warnings": string[]
}

Patch permitido (mesmas regras):
1) { "target":"section", "sectionType":"richtext", "op":"set_content", "content": string }
2) { "target":"section", "sectionType":"personal", "op":"set_fields", "fields": {"fullName"?:string,"role"?:string,"email"?:string,"phone"?:string,"location"?:string,"linkedin"?:string} }
3) { "target":"section", "sectionType":"list", "op":"set_list", "list": string[] }
4) { "target":"item", "sectionType":"repeatable_group", "sectionTitleHint":"Experiência"|"Educação", "op":"set_item", "index": number, "item": {"title"?:string,"subtitle"?:string,"date"?:string,"description"?:string} }
5) { "target":"item", "sectionType":"repeatable_group", "sectionTitleHint":"Experiência"|"Educação", "op":"add_item", "item": {"title"?:string,"subtitle"?:string,"date"?:string,"description"?:string} }

CONTEXTO ATUAL DO CURRÍCULO (JSON):
${contextJson}

RESPOSTAS DO USUÁRIO ÀS PERGUNTAS:
${qa}

Agora gere melhorias com base nessas respostas e proponha patches aplicáveis.
`;

      const resp = await invokeGeminiJson<AssistantResponse>({
        prompt,
        requestType: 'chat',
        temperature: 0.35,
        maxOutputTokens: 1600,
      });

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: String(resp?.reply ?? '').trim() || 'Ok — gerei sugestões com base nas suas respostas.',
        patches: Array.isArray(resp?.patches) ? resp.patches : undefined,
        followupQuestions: Array.isArray(resp?.followupQuestions) ? resp.followupQuestions : undefined,
        warnings: Array.isArray(resp?.warnings) ? resp.warnings : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      setError(e?.message || 'Erro ao gerar sugestões com suas respostas.');
    } finally {
      setIsSending(false);
    }
  };

  const getSectionSnapshot = (sectionType: SectionType, titleHint?: 'Experiência' | 'Educação') => {
    if (sectionType === 'list') {
      return cvData.sections.find((s) => s.type === 'list' && /habil/i.test(s.title)) ?? null;
    }
    if (sectionType === 'repeatable_group') {
      if (titleHint === 'Educação') {
        return cvData.sections.find((s) => s.type === 'repeatable_group' && /(forma|educa)/i.test(s.title)) ?? null;
      }
      if (titleHint === 'Experiência') {
        return cvData.sections.find((s) => s.type === 'repeatable_group' && /experi/i.test(s.title)) ?? null;
      }
      return cvData.sections.find((s) => s.type === 'repeatable_group') ?? null;
    }
    return cvData.sections.find((s) => s.type === sectionType) ?? null;
  };

  const needsConfirmation = (patches: Patch[]) => {
    const fields: ConfirmField[] = [];

    for (const p of patches) {
      if (p.target === 'section' && p.sectionType === 'personal' && p.op === 'set_fields') {
        const personal = getSectionSnapshot('personal') as any;
        const current = (personal?.fields ?? {}) as Record<string, string>;
        const map: Record<string, string> = {
          fullName: 'Nome completo',
          role: 'Cargo',
          email: 'Email',
          phone: 'Telefone',
          location: 'Localização',
          linkedin: 'LinkedIn',
        };
        for (const [k, v] of Object.entries(p.fields || {})) {
          const proposed = String(v ?? '').trim();
          if (!proposed) continue;
          const curr = String(current?.[k] ?? '').trim();
          if (proposed !== curr) {
            fields.push({
              key: `personal.${k}`,
              label: map[k] ?? k,
              currentValue: curr,
              proposedValue: proposed,
            });
          }
        }
      }

      if (p.target === 'item' && p.sectionType === 'repeatable_group' && (p.op === 'set_item' || p.op === 'add_item')) {
        const section = getSectionSnapshot('repeatable_group', p.sectionTitleHint);
        const idx = p.op === 'set_item' ? p.index : (section?.items?.length ?? 0);
        const currentItem = p.op === 'set_item' ? section?.items?.[p.index] : null;
        const labelPrefix = `${p.sectionTitleHint ?? 'Itens'} #${idx + 1}`;

        const proposed = p.item || {};
        const currentTitle = String(currentItem?.title ?? '').trim();
        const currentSubtitle = String(currentItem?.subtitle ?? '').trim();
        const currentDate = String(currentItem?.date ?? '').trim();

        const proposedTitle = String(proposed.title ?? '').trim();
        const proposedSubtitle = String(proposed.subtitle ?? '').trim();
        const proposedDate = String(proposed.date ?? '').trim();

        // These are high-risk fields for hallucination; always require confirmation if set.
        if (proposedTitle && proposedTitle !== currentTitle) {
          fields.push({
            key: `rg.${p.sectionTitleHint ?? 'Itens'}.${idx}.title`,
            label: `${labelPrefix} — Cargo/Título`,
            currentValue: currentTitle,
            proposedValue: proposedTitle,
          });
        }
        if (proposedSubtitle && proposedSubtitle !== currentSubtitle) {
          fields.push({
            key: `rg.${p.sectionTitleHint ?? 'Itens'}.${idx}.subtitle`,
            label: `${labelPrefix} — Empresa/Instituição`,
            currentValue: currentSubtitle,
            proposedValue: proposedSubtitle,
          });
        }
        if (proposedDate && proposedDate !== currentDate) {
          fields.push({
            key: `rg.${p.sectionTitleHint ?? 'Itens'}.${idx}.date`,
            label: `${labelPrefix} — Período/Data`,
            currentValue: currentDate,
            proposedValue: proposedDate,
          });
        }
      }
    }

    return fields;
  };

  const applyForMessage = (messageId: string, patches: Patch[]) => {
    const fields = needsConfirmation(patches);
    if (fields.length > 0) {
      const values: Record<string, string> = {};
      for (const f of fields) values[f.key] = String(f.proposedValue ?? '');
      setConfirm({ messageId, patches, fields, values });
      return;
    }

    const { applied, skipped } = onApplyPatches(patches);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              applied: true,
              content: `${m.content}\n\n(Alterações aplicadas: ${applied}${skipped ? `; ignoradas: ${skipped}` : ''})`,
            }
          : m,
      ),
    );
  };

  const confirmAndApply = () => {
    if (!confirm) return;

    const adjusted: Patch[] = confirm.patches.map((p) => {
      if (p.target === 'section' && p.sectionType === 'personal' && p.op === 'set_fields') {
        const nextFields: Record<string, string | undefined> = { ...p.fields };
        for (const key of Object.keys(nextFields)) {
          const v = confirm.values[`personal.${key}`];
          if (typeof v === 'string') nextFields[key] = v.trim();
        }
        return { ...p, fields: nextFields };
      }

      if (p.target === 'item' && p.sectionType === 'repeatable_group' && (p.op === 'set_item' || p.op === 'add_item')) {
        const idx = p.op === 'set_item' ? p.index : -1;
        const hint = p.sectionTitleHint ?? 'Itens';
        const titleKey = `rg.${hint}.${idx >= 0 ? idx : 'new'}.title`;
        const subtitleKey = `rg.${hint}.${idx >= 0 ? idx : 'new'}.subtitle`;
        const dateKey = `rg.${hint}.${idx >= 0 ? idx : 'new'}.date`;

        // For add_item we used "next index" when building fields; reproduce that key scheme.
        // We'll fallback to matching by prefix when idx=-1.
        const maybeIdxKeys = Object.keys(confirm.values).filter((k) => k.startsWith(`rg.${hint}.`));
        const pickKey = (suffix: 'title' | 'subtitle' | 'date') => {
          const exact = idx >= 0 ? `rg.${hint}.${idx}.${suffix}` : null;
          if (exact && confirm.values[exact] !== undefined) return exact;
          const candidate = maybeIdxKeys.find((k) => k.endsWith(`.${suffix}`));
          return candidate;
        };

        const nextItem = { ...p.item };
        const tKey = pickKey('title');
        const sKey = pickKey('subtitle');
        const dKey = pickKey('date');

        if (tKey) nextItem.title = String(confirm.values[tKey] ?? '').trim();
        if (sKey) nextItem.subtitle = String(confirm.values[sKey] ?? '').trim();
        if (dKey) nextItem.date = String(confirm.values[dKey] ?? '').trim();
        return { ...p, item: nextItem };
      }

      return p;
    });

    const { applied, skipped } = onApplyPatches(adjusted);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === confirm.messageId
          ? {
              ...m,
              applied: true,
              content: `${m.content}\n\n(Alterações aplicadas: ${applied}${skipped ? `; ignoradas: ${skipped}` : ''})`,
            }
          : m,
      ),
    );
    setConfirm(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">

      <aside
        className={clsx(
          'pointer-events-auto absolute right-0 top-0 h-full w-full sm:w-[420px] bg-[color:var(--cv-surface)] border-l border-[color:var(--cv-border-weak)] shadow-[var(--cv-shadow-2)] flex flex-col',
        )}
        role="dialog"
      >
        <div className="shrink-0 px-4 py-3 border-b border-[color:var(--cv-border-weak)] bg-[var(--cv-surface-a85)] backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[var(--cv-accent-a18)] border border-[color:var(--cv-border-weak)]">
                <Sparkles className="w-4 h-4 text-[color:var(--cv-accent)]" />
              </div>
              <div>
                <div className="text-sm font-bold text-[color:var(--cv-text)]">Assistente IA</div>
                <div className="text-xs text-[color:var(--cv-muted)]">Sugestões + aplicar mudanças</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[color:var(--cv-muted)] hover:text-[color:var(--cv-text)] hover:bg-white/5"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-rose-300" />
              <div>{error}</div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={clsx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={clsx(
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap',
                  m.role === 'user'
                    ? 'bg-[color:var(--cv-accent)] text-[#0B1220] font-medium'
                    : 'bg-[var(--cv-surface-a85)] border border-[color:var(--cv-border-weak)] text-[color:var(--cv-text)]',
                )}
              >
                {m.content}

                {m.role === 'assistant' && Array.isArray(m.warnings) && m.warnings.length > 0 && (
                  <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                    <div className="font-semibold mb-1">Atenção</div>
                    <ul className="list-disc list-inside space-y-1">
                      {m.warnings.slice(0, 5).map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {m.role === 'assistant' && Array.isArray(m.followupQuestions) && m.followupQuestions.length > 0 && (
                  <div className="mt-3 p-2 rounded-lg bg-white/5 border border-[color:var(--cv-border-weak)] text-[color:var(--cv-text)] text-xs">
                    <div className="font-semibold mb-1">Preciso de informações</div>
                    <ul className="list-disc list-inside space-y-1">
                      {m.followupQuestions.slice(0, 6).map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>

                    <div className="mt-3 space-y-2">
                      {m.followupQuestions.slice(0, 6).map((q, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="text-[11px] text-[color:var(--cv-muted)]">{`A${idx + 1}`}</div>
                          <input
                            value={(followupAnswersByMessage[m.id]?.[idx] ?? '') as string}
                            onChange={(e) =>
                              setFollowupAnswersByMessage((prev) => {
                                const next = { ...prev };
                                const arr = Array.isArray(next[m.id]) ? [...next[m.id]] : [];
                                arr[idx] = e.target.value;
                                next[m.id] = arr;
                                return next;
                              })
                            }
                            placeholder={q}
                            className="w-full bg-[color:var(--cv-surface)] border border-[color:var(--cv-border-weak)] rounded-xl px-3 py-2 text-xs text-[color:var(--cv-text)] placeholder:text-[color:var(--cv-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cv-accent-a28)] focus:border-[color:var(--cv-accent)]"
                            disabled={isSending}
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        className={clsx(
                          'mt-1 w-full px-3 py-2 rounded-xl font-bold transition-colors',
                          isSending
                            ? 'bg-white/5 text-[color:var(--cv-muted)] cursor-not-allowed'
                            : 'bg-[color:var(--cv-accent)] hover:bg-[color:var(--cv-accent-hover)] text-[#0B1220]',
                        )}
                        disabled={isSending}
                        onClick={() => generateFromFollowups(m)}
                      >
                        {isSending ? 'Gerando…' : 'Gerar sugestões com minhas respostas'}
                      </button>

                      <button
                        type="button"
                        className="w-full px-3 py-2 rounded-xl bg-[color:var(--cv-surface)] hover:bg-white/5 text-[color:var(--cv-text)] font-bold border border-[color:var(--cv-border-weak)]"
                        onClick={() => {
                          const template = m.followupQuestions
                            ?.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: `)
                            .join('\n');
                          setInput((prev) => (prev ? `${prev}\n\n${template}` : template || ''));
                        }}
                        disabled={isSending}
                      >
                        Responder no chat (alternativo)
                      </button>
                    </div>
                  </div>
                )}

                {m.role === 'assistant' && Array.isArray(m.patches) && m.patches.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[color:var(--cv-border-weak)]">
                    <div className="text-xs font-semibold text-[color:var(--cv-muted)] mb-2 flex items-center gap-2">
                      <Wand2 className="w-3.5 h-3.5 text-[color:var(--cv-accent)]" />
                      Alterações sugeridas
                    </div>
                    <ul className="text-xs text-[color:var(--cv-text)] space-y-1">
                      {m.patches.slice(0, 6).map((p, idx) => (
                        <li key={idx} className="opacity-90">• {summarizePatch(p)}</li>
                      ))}
                      {m.patches.length > 6 && (
                        <li className="opacity-70">• +{m.patches.length - 6} outras</li>
                      )}
                    </ul>
                    <button
                      type="button"
                      disabled={Boolean(m.applied)}
                      onClick={() => applyForMessage(m.id, m.patches!)}
                      className={clsx(
                        'mt-3 w-full px-3 py-2 rounded-xl text-sm font-bold transition-all',
                        m.applied
                          ? 'bg-white/5 text-[color:var(--cv-muted)] cursor-not-allowed border border-[color:var(--cv-border-weak)]'
                          : 'bg-[color:var(--cv-accent)] hover:bg-[color:var(--cv-accent-hover)] text-[#0B1220]',
                      )}
                    >
                      {m.applied ? 'Alterações aplicadas' : 'Aplicar mudanças'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {confirm && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-[520px] bg-[color:var(--cv-surface)] border border-[color:var(--cv-border-weak)] rounded-2xl shadow-[var(--cv-shadow-2)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[color:var(--cv-border-weak)] flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[color:var(--cv-text)]">Confirme as informações</div>
                  <div className="text-xs text-[color:var(--cv-muted)]">A IA sugeriu dados sensíveis (empresa/datas/contatos). Revise antes de aplicar.</div>
                </div>
                <button
                  type="button"
                  className="p-2 rounded-lg text-[color:var(--cv-muted)] hover:text-[color:var(--cv-text)] hover:bg-white/5"
                  onClick={() => setConfirm(null)}
                  aria-label="Fechar confirmação"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                {confirm.fields.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-xs font-semibold text-[color:var(--cv-muted)]">{f.label}</label>
                    {f.currentValue ? (
                      <div className="text-[11px] text-[color:var(--cv-muted)]">Atual: {f.currentValue}</div>
                    ) : (
                      <div className="text-[11px] text-[color:var(--cv-muted)]">Atual: (vazio)</div>
                    )}
                    <input
                      value={confirm.values[f.key] ?? ''}
                      onChange={(e) => setConfirm((prev) => (prev ? { ...prev, values: { ...prev.values, [f.key]: e.target.value } } : prev))}
                      className="w-full bg-[color:var(--cv-surface)] border border-[color:var(--cv-border-weak)] rounded-xl px-3 py-2 text-sm text-[color:var(--cv-text)] placeholder:text-[color:var(--cv-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cv-accent-a28)] focus:border-[color:var(--cv-accent)]"
                      placeholder={f.proposedValue || ''}
                    />
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-[color:var(--cv-border-weak)] flex gap-2">
                <button
                  type="button"
                  className="flex-1 px-3 py-2 rounded-xl bg-[color:var(--cv-surface)] hover:bg-white/5 text-[color:var(--cv-text)] font-bold border border-[color:var(--cv-border-weak)]"
                  onClick={() => setConfirm(null)}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  className="flex-1 px-3 py-2 rounded-xl bg-[color:var(--cv-accent)] hover:bg-[color:var(--cv-accent-hover)] text-[#0B1220] font-bold"
                  onClick={confirmAndApply}
                >
                  Confirmar e aplicar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="shrink-0 p-4 border-t border-[color:var(--cv-border-weak)] bg-[var(--cv-surface-a85)] backdrop-blur">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ex: crie um resumo para Desenvolvedor Jr"
              className="flex-1 bg-[color:var(--cv-surface)] border border-[color:var(--cv-border-weak)] rounded-xl px-3 py-2 text-sm text-[color:var(--cv-text)] placeholder:text-[color:var(--cv-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cv-accent-a28)] focus:border-[color:var(--cv-accent)]"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={send}
              disabled={isSending || !input.trim()}
              className={clsx(
                'px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-center',
                isSending || !input.trim()
                  ? 'bg-white/5 text-[color:var(--cv-muted)] cursor-not-allowed border border-[color:var(--cv-border-weak)]'
                  : 'bg-[color:var(--cv-accent)] text-[#0B1220] hover:bg-[color:var(--cv-accent-hover)]',
              )}
              aria-label="Enviar"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-[11px] text-[color:var(--cv-muted)]">
            Dica: peça melhorias por seção (Resumo, Experiência, Habilidades).
          </div>
        </div>
      </aside>
    </div>
  );
};
