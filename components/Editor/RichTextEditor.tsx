import React, { useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Underline as UnderlineIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ImproveTextButton } from './ImproveTextButton';
import { ImproveRichTextContext } from '../../services/richTextImproveService';
import { extractHtmlFromWrapper, normalizeRichTextHtml } from '../../utils/richTextAdapter';

interface RichTextEditorProps {
    content: unknown;
    onChange: (content: string) => void;
    placeholder?: string;
    label?: string;
    improveContext?: ImproveRichTextContext;
    enableImprove?: boolean;
    className?: string;
}

const MenuButton = ({
    isActive,
    onClick,
    children,
    title
}: {
    isActive?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
}) => (
    <button
        onClick={(e) => {
            e.preventDefault();
            onClick();
        }}
        className={clsx(
            "p-1.5 rounded transition-colors",
            isActive
                ? "bg-[var(--cv-accent-a18)] text-[color:var(--cv-accent)]"
                : "text-[color:var(--cv-muted)] hover:text-[color:var(--cv-text)] hover:bg-white/5"
        )}
        title={title}
    >
        {children}
    </button>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    content,
    onChange,
    placeholder,
    label,
    improveContext,
    enableImprove = true,
    className
}) => {
    const normalizedContent = useMemo(() => normalizeRichTextHtml(content), [content]);
    const repairedRef = useRef<string | null>(null);

    const extensions = useMemo(() => [
        StarterKit,
        Underline,
        Link.configure({
            openOnClick: false,
            HTMLAttributes: {
                class: 'cv-link underline cursor-pointer',
            },
        }),
    ], []);

    const editor = useEditor({
        extensions,
        content: normalizedContent,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[100px] text-sm text-[color:var(--cv-text)] leading-[1.6] font-normal cv-prose',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // TipTap only uses the initial `content` on mount. When external state loads/changes
    // (e.g. parsed CV being set into the store), we need to sync it into the editor.
    useEffect(() => {
        if (!editor) return;

        const next = normalizeRichTextHtml(content);
        const current = normalizeRichTextHtml(editor.getHTML());
        if (next !== current) {
            // `false` prevents triggering onUpdate/onChange during hydration.
            editor.commands.setContent(next || '', { emitUpdate: false });
        }

        // Repair invalid stored values like {"html":"..."} or JSON-string wrappers.
        // We only do it once per distinct raw value to avoid loops.
        const maybeWrapped = extractHtmlFromWrapper(content);
        if (typeof maybeWrapped === 'string' && repairedRef.current !== String(content)) {
            repairedRef.current = String(content);
            onChange(maybeWrapped);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className={twMerge("space-y-2", className)}>
            {label && (
                <div className="flex justify-between items-center">
                    <label className="text-[12px] font-semibold text-[color:var(--label-text)]">
                        {label}
                    </label>
                    {enableImprove && improveContext && (
                        <ImproveTextButton
                            context={improveContext}
                            currentHtml={normalizedContent}
                            getHtml={() => editor.getHTML()}
                            setHtml={(next) => {
                                editor.commands.setContent(next || '', { emitUpdate: true });
                            }}
                        />
                    )}
                </div>
            )}

            <div className="bg-[color:var(--input-bg)] border border-[color:var(--input-border)] hover:border-[color:var(--input-border-hover)] hover:bg-[color:var(--input-bg-hover)] rounded-xl overflow-hidden focus-within:border-[color:var(--input-border-focus)] focus-within:bg-[color:var(--input-bg-focus)] focus-within:shadow-[var(--focus-ring)] transition-colors shadow-[var(--cv-shadow-1)]">
                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b border-[color:var(--cv-border-weak)] bg-[color:var(--editor-card)]">
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        title="Negrito"
                    >
                        <Bold className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        title="Itálico"
                    >
                        <Italic className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive('underline')}
                        title="Sublinhado"
                    >
                        <UnderlineIcon className="w-4 h-4" />
                    </MenuButton>

                    <div className="w-px h-4 bg-[color:var(--cv-border-weak)] mx-1" />

                    <MenuButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        title="Lista com marcadores"
                    >
                        <List className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        title="Lista numerada"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </MenuButton>

                    <div className="w-px h-4 bg-[color:var(--cv-border-weak)] mx-1" />

                    <MenuButton
                        onClick={() => {
                            const previousUrl = editor.getAttributes('link').href;
                            const url = window.prompt('URL:', previousUrl);
                            if (url === null) return;
                            if (url === '') {
                                editor.chain().focus().extendMarkRange('link').unsetLink().run();
                                return;
                            }
                            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                        }}
                        isActive={editor.isActive('link')}
                        title="Link"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </MenuButton>

                    <div className="ml-auto">
                        {!label && enableImprove && improveContext && (
                            <ImproveTextButton
                                context={improveContext}
                                currentHtml={normalizedContent}
                                getHtml={() => editor.getHTML()}
                                setHtml={(next) => {
                                    editor.commands.setContent(next || '', { emitUpdate: true });
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Editor Content */}
                <div className="p-4 bg-[color:var(--input-bg)]">
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
};
