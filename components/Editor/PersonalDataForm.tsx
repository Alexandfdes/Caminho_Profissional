import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useResumeStore } from '../../stores/resumeStore';
import { Camera, MoreVertical, Trash2, Plus, X, Mail, Phone, MapPin, Globe, Linkedin, Github } from 'lucide-react';
import { clsx } from 'clsx';
import { Section } from '../../types/cv';

const personalSchema = z.object({
    photo: z.string().optional(),
    firstName: z.string().min(2, "Nome obrigatório"),
    lastName: z.string().optional(),
    role: z.string().optional(),
    useRoleAsTitle: z.boolean().optional(),
    email: z.string().email("E-mail inválido").optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    zipCode: z.string().optional(),
    city: z.string().optional(),
    birthDate: z.string().optional(),
    driversLicense: z.string().optional(),
    nationality: z.string().optional(),
    gender: z.string().optional(),
    civilStatus: z.string().optional(),
    website: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
});

type PersonalFormValues = z.infer<typeof personalSchema>;

interface PersonalDataFormProps {
    section: Section;
}

export const PersonalDataForm: React.FC<PersonalDataFormProps> = ({ section }) => {
    const { updateSection } = useResumeStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    // Campos que são exibidos apenas sob demanda
    const optionalFields = ['birthDate', 'nationality', 'driversLicense', 'gender', 'civilStatus'];
    const [activeOptionalFields, setActiveOptionalFields] = useState<string[]>(() => {
        return optionalFields.filter(f => !!section.fields?.[f]);
    });

    // Campos personalizados (customFields é um array de {key, label})
    const [customFields, setCustomFields] = useState<{ key: string; label: string }[]>(() => {
        const existing = section.fields?.customFields as { key: string; label: string }[] | undefined;
        return existing || [];
    });

    const { register, watch, setValue, reset, formState: { errors } } = useForm<PersonalFormValues>({
        resolver: zodResolver(personalSchema),
        defaultValues: section.fields as PersonalFormValues,
        mode: 'onChange',
    });

    // Ref para evitar loop infinito - rastreia a última versão sincronizada
    const lastSyncedRef = useRef<string>(JSON.stringify(section.fields || {}));

    // Sincroniza o formulário quando section.fields é atualizado externamente (ex: upload de PDF)
    useEffect(() => {
        const currentJson = JSON.stringify(section.fields || {});
        // Só faz reset se os dados realmente mudaram de uma fonte externa
        if (section.fields && currentJson !== lastSyncedRef.current) {
            lastSyncedRef.current = currentJson;
            reset(section.fields as PersonalFormValues);
            // Atualiza os campos opcionais ativos
            setActiveOptionalFields(optionalFields.filter(f => !!section.fields?.[f]));
        }
    }, [section.fields, reset]);

    const photoValue = watch('photo');

    useEffect(() => {
        const subscription = watch((value) => {
            updateSection(section.id, { fields: value });
        });
        return () => subscription.unsubscribe();
    }, [watch, section.id, updateSection]);

    // --- Lógica de Imagem ---
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setValue('photo', base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => setValue('photo', '');

    // --- Lógica de Campos Dinâmicos ---
    const toggleOptionalField = (field: string) => {
        if (activeOptionalFields.includes(field)) {
            setActiveOptionalFields(prev => prev.filter(f => f !== field));
            setValue(field as any, '');
        } else {
            setActiveOptionalFields(prev => [...prev, field]);
        }
        setOpenMenu(null);
    };

    // --- Lógica de Campos Personalizados ---
    const [newCustomFieldName, setNewCustomFieldName] = useState('');

    const addCustomField = () => {
        if (newCustomFieldName.trim()) {
            const key = `custom_${Date.now()}`;
            const newField = { key, label: newCustomFieldName.trim() };
            setCustomFields(prev => [...prev, newField]);
            updateSection(section.id, {
                fields: {
                    ...section.fields,
                    customFields: [...customFields, newField],
                    [key]: ''
                }
            });
            setNewCustomFieldName(''); // Limpar o campo
        }
    };

    const removeCustomField = (key: string) => {
        setCustomFields(prev => prev.filter(f => f.key !== key));
        const newCustomFields = customFields.filter(f => f.key !== key);
        const newFields = { ...section.fields };
        delete (newFields as any)[key];
        (newFields as any).customFields = newCustomFields;
        updateSection(section.id, { fields: newFields });
    };

    const updateCustomFieldValue = (key: string, value: string) => {
        updateSection(section.id, {
            fields: {
                ...section.fields,
                [key]: value
            }
        });
    };

    const labelClass = "text-[10px] uppercase font-bold text-[color:var(--cv-muted)] absolute top-2 left-3 transition-colors group-focus-within:text-[color:var(--cv-accent)] z-10";
    const inputClass = "w-full bg-[color:var(--input-bg)] border border-[color:var(--input-border)] rounded-lg pt-6 pb-2 px-3 text-sm font-medium text-[color:var(--input-text)] placeholder:text-[color:var(--input-placeholder)] outline-none transition-all hover:border-[color:var(--input-border-hover)] hover:bg-[color:var(--input-bg-hover)] focus:border-[color:var(--input-border-focus)] focus:bg-[color:var(--input-bg-focus)] focus:shadow-[var(--focus-ring)]";
    const inputWithIconClass = "w-full bg-[color:var(--input-bg)] border border-[color:var(--input-border)] rounded-lg pt-6 pb-2 pl-10 pr-3 text-sm font-medium text-[color:var(--input-text)] placeholder:text-[color:var(--input-placeholder)] outline-none transition-all hover:border-[color:var(--input-border-hover)] hover:bg-[color:var(--input-bg-hover)] focus:border-[color:var(--input-border-focus)] focus:bg-[color:var(--input-bg-focus)] focus:shadow-[var(--focus-ring)]";
    const iconClass = "absolute left-3 bottom-[10px] w-4 h-4 text-[color:var(--cv-muted)] group-focus-within:text-[color:var(--cv-accent)] transition-colors";

    const getFieldLabel = (field: string) => {
        const labels: Record<string, string> = {
            birthDate: 'Data de Nascimento',
            civilStatus: 'Estado Civil',
            driversLicense: 'Carteira de Motorista',
            nationality: 'Nacionalidade',
            gender: 'Gênero',
            naturalidade: 'Naturalidade',
        };
        return labels[field] || field;
    };

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">

            {/* Seção 1: Foto + Nome em destaque */}
            <div className="flex items-start gap-5 p-4 bg-[var(--cv-surface-a85)] rounded-xl border border-[color:var(--cv-border-weak)]">
                {/* Foto */}
                <div
                    onClick={() => !photoValue && fileInputRef.current?.click()}
                    className={clsx(
                        "relative w-20 h-20 shrink-0 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all group",
                        photoValue ? "border-transparent" : "border-[color:var(--input-border)] hover:border-[color:var(--cv-accent)] cursor-pointer bg-[color:var(--input-bg)]"
                    )}
                >
                    {photoValue ? (
                        <>
                            <img src={photoValue} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                onClick={(e) => { e.stopPropagation(); removeImage(); }}
                                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={18} className="text-white" />
                            </button>
                        </>
                    ) : (
                        <Camera size={20} className="text-[color:var(--cv-muted)] group-hover:text-[color:var(--cv-accent)]" />
                    )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

                {/* Nome e Cargo */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="group relative">
                        <label className={labelClass}>Nome</label>
                        <input {...register('firstName')} className={inputClass} placeholder="Ex: Francisco" />
                    </div>
                    <div className="group relative">
                        <label className={labelClass}>Sobrenome</label>
                        <input {...register('lastName')} className={inputClass} placeholder="Ex: Oliveira" />
                    </div>
                    <div className="group relative md:col-span-2">
                        <label className={labelClass}>Vaga desejada</label>
                        <div className="flex gap-3">
                            <input {...register('role')} className={clsx(inputClass, "flex-1")} placeholder="Ex: Desenvolvedor Full Stack" />
                            <label className="flex items-center gap-2 shrink-0 px-3 cursor-pointer">
                                <input type="checkbox" {...register('useRoleAsTitle')} className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-teal-600 focus:ring-teal-500" />
                                <span className="text-[11px] text-gray-400 whitespace-nowrap">Usar como título</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seção 2: Contatos (E-mail e Telefone lado a lado) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="group relative">
                    <label className={labelClass}>E-mail</label>
                    <Mail className={iconClass} />
                    <input {...register('email')} className={inputWithIconClass} placeholder="email@exemplo.com" />
                </div>
                <div className="group relative">
                    <label className={labelClass}>Telefone</label>
                    <Phone className={iconClass} />
                    <input {...register('phone')} className={inputWithIconClass} placeholder="(84) 99652-4413" />
                </div>
            </div>

            {/* Seção 3: Endereço (Layout compacto) */}
            <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-6 group relative">
                    <label className={labelClass}>Endereço</label>
                    <MapPin className={iconClass} />
                    <input {...register('address')} className={inputWithIconClass} placeholder="Rua, Número, Bairro" />
                </div>
                <div className="col-span-6 md:col-span-3 group relative">
                    <label className={labelClass}>CEP</label>
                    <input {...register('zipCode')} className={inputClass} placeholder="59000-000" />
                </div>
                <div className="col-span-6 md:col-span-3 group relative">
                    <label className={labelClass}>Cidade</label>
                    <input {...register('city')} className={inputClass} placeholder="Natal" />
                </div>
            </div>

            {/* Seção 4: Links Sociais (3 colunas) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="group relative">
                    <label className={labelClass}>LinkedIn</label>
                    <Linkedin className={iconClass} />
                    <input {...register('linkedin')} className={inputWithIconClass} placeholder="linkedin.com/in/usuario" />
                </div>
                <div className="group relative">
                    <label className={labelClass}>GitHub</label>
                    <Github className={iconClass} />
                    <input {...register('github')} className={inputWithIconClass} placeholder="github.com/usuario" />
                </div>
                <div className="group relative">
                    <label className={labelClass}>Website</label>
                    <Globe className={iconClass} />
                    <input {...register('website')} className={inputWithIconClass} placeholder="meusite.com" />
                </div>
            </div>

            {/* Seção 5: Campos Opcionais Dinâmicos */}
            {activeOptionalFields.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeOptionalFields.map(field => (
                        <div key={field} className="group relative animate-in zoom-in-95 duration-200">
                            <label className={labelClass}>{getFieldLabel(field)}</label>
                            <input {...register(field as any)} className={inputClass} />
                            <button
                                onClick={() => toggleOptionalField(field)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[color:var(--cv-muted)] hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {/* Campos Personalizados */}
                    {customFields.map(({ key, label }) => (
                        <div key={key} className="group relative animate-in zoom-in-95 duration-200">
                            <label className={labelClass}>{label}</label>
                            <input
                                value={(section.fields as any)?.[key] || ''}
                                onChange={(e) => updateCustomFieldValue(key, e.target.value)}
                                className={inputClass}
                            />
                            <button
                                onClick={() => removeCustomField(key)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[color:var(--cv-muted)] hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Rodapé: Botões para adicionar campos */}
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/5">
                <span className="text-[10px] uppercase font-bold text-[color:var(--cv-muted)] mr-2 self-center">Adicionar:</span>
                {optionalFields.filter(f => !activeOptionalFields.includes(f)).map(field => (
                    <button
                        key={field}
                        onClick={() => toggleOptionalField(field)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[color:var(--cv-border-weak)] text-[11px] text-[color:var(--cv-muted)] hover:bg-[var(--cv-accent-a18)] hover:text-[color:var(--cv-accent)] hover:border-[color:var(--cv-accent)] transition-all"
                    >
                        <Plus size={12} /> {getFieldLabel(field)}
                    </button>
                ))}
                {/* Input inline para campo personalizado */}
                <div className="flex items-center gap-1 ml-2">
                    <input
                        type="text"
                        value={newCustomFieldName}
                        onChange={(e) => setNewCustomFieldName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomField()}
                        placeholder="Campo personalizado..."
                        className="w-36 px-2.5 py-1 rounded-full border border-dashed border-[color:var(--cv-border-weak)] bg-transparent text-[11px] text-[color:var(--cv-text)] placeholder:text-[color:var(--cv-muted)] outline-none focus:border-[color:var(--cv-accent)] transition-all"
                    />
                    {newCustomFieldName.trim() && (
                        <button
                            onClick={addCustomField}
                            className="p-1 rounded-full bg-[color:var(--cv-accent)] text-white hover:opacity-80 transition-opacity"
                        >
                            <Plus size={12} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

