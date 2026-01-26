import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useResumeStore } from '../../stores/resumeStore';
import { Wand2, Camera, MoreVertical, Trash2, Plus, X } from 'lucide-react';
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
    const optionalFields = ['nationality', 'gender', 'civilStatus', 'driversLicense', 'birthDate'];
    const [activeOptionalFields, setActiveOptionalFields] = useState<string[]>(() => {
        return optionalFields.filter(f => !!section.fields?.[f]);
    });

    const { register, watch, setValue, formState: { errors } } = useForm<PersonalFormValues>({
        resolver: zodResolver(personalSchema),
        defaultValues: section.fields as PersonalFormValues,
        mode: 'onChange',
    });

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

    const labelClass = "text-[11px] font-bold text-[color:var(--muted-text)] uppercase tracking-wider mb-1 block";
    const inputClass = "w-full bg-[color:var(--input-bg)] border border-[color:var(--input-border)] rounded-lg p-2 text-[14px] text-white outline-none focus:border-[color:var(--input-border-focus)] transition-all";

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-12 gap-5">

                {/* Coluna 1: Uploader de Foto (3 cols) */}
                <div className="col-span-12 md:col-span-3 flex flex-col items-center justify-start pt-1">
                    <label className={labelClass}>Foto</label>
                    <div
                        onClick={() => !photoValue && fileInputRef.current?.click()}
                        className={clsx(
                            "relative w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all group",
                            photoValue ? "border-transparent" : "border-[color:var(--input-border)] hover:border-[color:var(--cv-accent)] cursor-pointer bg-[color:var(--input-bg)]"
                        )}
                    >
                        {photoValue ? (
                            <>
                                <img src={photoValue} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                                    className="absolute top-1 right-1 p-1 bg-rose-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={14} className="text-white" />
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-[color:var(--muted-text)] group-hover:text-[color:var(--cv-accent)]">
                                <Camera size={24} className="mb-2" />
                                <span className="text-[10px] font-medium">Upload</span>
                            </div>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>

                {/* Coluna 2: Dados Principais (9 cols) */}
                <div className="col-span-12 md:col-span-9 grid grid-cols-12 gap-4">
                    <div className="col-span-6">
                        <label className={labelClass}>Nome</label>
                        <input {...register('firstName')} className={inputClass} placeholder="Ex: Francisco Osmar" />
                    </div>
                    <div className="col-span-6">
                        <label className={labelClass}>Sobrenome</label>
                        <input {...register('lastName')} className={inputClass} placeholder="Ex: de Oliveira" />
                    </div>

                    <div className="col-span-8">
                        <label className={labelClass}>Vaga desejada</label>
                        <input {...register('role')} className={inputClass} placeholder="Ex: Motorista" />
                    </div>
                    <div className="col-span-4 flex items-center gap-2 pt-6">
                        <input type="checkbox" {...register('useRoleAsTitle')} id="useRoleAsTitle" className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-teal-600 focus:ring-teal-500" />
                        <label htmlFor="useRoleAsTitle" className="text-[11px] text-gray-400 cursor-pointer">Usar como título</label>
                    </div>
                </div>

                {/* Linha 2: Contatos */}
                <div className="col-span-12 md:col-span-6">
                    <label className={labelClass}>E-mail</label>
                    <input {...register('email')} className={inputClass} />
                </div>
                <div className="col-span-12 md:col-span-6">
                    <label className={labelClass}>Telefone</label>
                    <input {...register('phone')} className={inputClass} placeholder="(84) 99652-4413" />
                </div>

                {/* Linha 3: Localização */}
                <div className="col-span-12 md:col-span-6">
                    <label className={labelClass}>Endereço</label>
                    <input {...register('address')} className={inputClass} placeholder="Rua, Número, Bairro" />
                </div>
                <div className="col-span-12 md:col-span-3">
                    <label className={labelClass}>CEP</label>
                    <input {...register('zipCode')} className={inputClass} />
                </div>
                <div className="col-span-12 md:col-span-3">
                    <label className={labelClass}>Cidade</label>
                    <input {...register('city')} className={inputClass} />
                </div>

                {/* Campos Opcionais Dinâmicos */}
                {activeOptionalFields.map(field => (
                    <div key={field} className="col-span-12 md:col-span-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center">
                            <label className={labelClass}>
                                {field === 'birthDate' ? 'Data de Nascimento' :
                                    field === 'civilStatus' ? 'Estado Civil' :
                                        field === 'driversLicense' ? 'CNH' : field}
                            </label>
                            <div className="relative">
                                <button onClick={() => setOpenMenu(openMenu === field ? null : field)} className="text-gray-500 hover:text-white p-1">
                                    <MoreVertical size={14} />
                                </button>
                                {openMenu === field && (
                                    <div className="absolute right-0 mt-1 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                        <button
                                            onClick={() => toggleOptionalField(field)}
                                            className="w-full px-3 py-2 text-left text-[11px] text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                                        >
                                            <Trash2 size={12} /> Excluir
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <input {...register(field as any)} className={inputClass} />
                    </div>
                ))}
            </div>

            {/* Rodapé de Adição de Campos */}
            <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
                {optionalFields.filter(f => !activeOptionalFields.includes(f)).map(field => (
                    <button
                        key={field}
                        onClick={() => toggleOptionalField(field)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-700 text-[11px] text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
                    >
                        <Plus size={14} /> {
                            field === 'birthDate' ? 'Data de Nascimento' :
                                field === 'civilStatus' ? 'Estado Civil' :
                                    field === 'driversLicense' ? 'CNH' : field
                        }
                    </button>
                ))}
            </div>
        </div>
    );
};
