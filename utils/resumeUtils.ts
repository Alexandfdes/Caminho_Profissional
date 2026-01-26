import { EditableCV, Section, SectionItem, FieldMetadata } from '../types/cv';
import { v4 as uuidv4 } from 'uuid';

interface ValidationResult {
    isValid: boolean;
    value: string;
    warning?: string;
}

const validateEmail = (email: string): ValidationResult => {
    const cleaned = email?.trim().toLowerCase() || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleaned) return { isValid: false, value: '' };
    if (!emailRegex.test(cleaned)) return { isValid: false, value: cleaned, warning: 'Formato de email inválido' };
    return { isValid: true, value: cleaned };
};

const validatePhone = (phone: string): ValidationResult => {
    const cleaned = phone?.replace(/[^\d+]/g, '') || '';
    if (!cleaned) return { isValid: false, value: '' };
    if (cleaned.length < 8) return { isValid: false, value: cleaned, warning: 'Número de telefone parece incompleto' };
    return { isValid: true, value: cleaned };
};

export const normalizeParsedResume = (parsed: any): EditableCV & { _parseWarnings: string[] } => {
    const sections: Section[] = [];
    const warnings: string[] = [];
    const timestamp = Date.now();
    const source: 'parsed:file' = 'parsed:file';

    // Helper to create metadata
    const createMeta = (): FieldMetadata => ({ source, timestamp });

    // 1. Personal Info
    const emailValidation = validateEmail(parsed?.extracted_contacts?.email || parsed?.personal_info?.email);
    if (emailValidation.warning) warnings.push(`Dados Pessoais: ${emailValidation.warning}`);

    const phoneValidation = validatePhone(parsed?.extracted_contacts?.phone || parsed?.personal_info?.phone);
    if (phoneValidation.warning) warnings.push(`Dados Pessoais: ${phoneValidation.warning}`);

    sections.push({
        id: 'personal',
        type: 'personal',
        title: 'Dados Pessoais',
        visible: true,
        collapsed: false,
        fields: {
            fullName: parsed?.personal_info?.name?.trim() || '',
            role: parsed?.personal_info?.role?.trim() || '',
            email: emailValidation.value,
            phone: phoneValidation.value,
            location: parsed?.personal_info?.location?.trim() || '',
            linkedin: parsed?.personal_info?.linkedin?.trim() || ''
        },
        _meta: {
            fullName: createMeta(),
            role: createMeta(),
            email: createMeta(),
            phone: createMeta(),
            location: createMeta(),
            linkedin: createMeta()
        }
    });

    // 2. Summary
    sections.push({
        id: 'summary',
        type: 'richtext',
        title: 'Resumo Profissional',
        visible: true,
        collapsed: false,
        content: parsed?.summary?.trim() || '',
        _meta: { content: createMeta() }
    });

    // 3. Experience
    const experienceItems: SectionItem[] = Array.isArray(parsed?.experience)
        ? parsed.experience.map((exp: any) => ({
            id: uuidv4(),
            title: exp.role?.trim() || '',
            subtitle: exp.company?.trim() || '',
            date: exp.period?.trim() || '',
            description: exp.description?.trim() || '',
            _meta: {
                title: createMeta(),
                subtitle: createMeta(),
                date: createMeta(),
                description: createMeta()
            }
        }))
        : [{ id: uuidv4(), title: '', subtitle: '', date: '', description: '' }];

    sections.push({
        id: 'experience',
        type: 'repeatable_group',
        title: 'Experiência Profissional',
        visible: true,
        collapsed: false,
        sortMode: 'auto',
        items: experienceItems
    });

    // 4. Education
    const educationItems: SectionItem[] = Array.isArray(parsed?.education)
        ? parsed.education.map((edu: any) => ({
            id: uuidv4(),
            title: edu.institution?.trim() || '',
            subtitle: edu.degree?.trim() || '',
            date: edu.period?.trim() || '',
            description: '',
            _meta: {
                title: createMeta(),
                subtitle: createMeta(),
                date: createMeta()
            }
        }))
        : [{ id: uuidv4(), title: '', subtitle: '', date: '', description: '' }];

    sections.push({
        id: 'education',
        type: 'repeatable_group',
        title: 'Formação Acadêmica',
        visible: true,
        collapsed: false,
        sortMode: 'auto',
        items: educationItems
    });

    // 5. Skills
    const skills: string[] = Array.isArray(parsed?.skills)
        ? Array.from(new Set(parsed.skills.map((s: any) => String(s).trim()))).filter(Boolean) as string[]
        : [];

    sections.push({
        id: 'skills',
        type: 'list',
        title: 'Habilidades',
        visible: true,
        collapsed: false,
        list: skills.length > 0 ? skills : [''],
        _meta: { list: createMeta() }
    });

    return {
        id: uuidv4(),
        sections,
        metadata: {
            template: 'default',
            lastUpdated: new Date().toISOString()
        },
        _parseWarnings: warnings
    };
};
