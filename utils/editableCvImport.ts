import { v4 as uuidv4 } from 'uuid';
import { EditableCV, FieldMetadata, Section, SectionItem } from '../types/cv';
import type { CVData } from './cvParser';

const createMeta = (timestamp: number): FieldMetadata => ({ source: 'parsed:file', timestamp });

const formatPeriod = (start?: string, end?: string) => {
  const s = String(start || '').trim();
  const e = String(end || '').trim();
  if (!s && !e) return '';
  if (s && !e) return s;
  if (!s && e) return e;
  return `${s} - ${e}`;
};

const uniqueList = (items: string[]) => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of items) {
    const v = String(raw || '').trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
};

export const buildEditableCVFromCVData = (data: CVData): EditableCV & { _parseWarnings: string[] } => {
  const timestamp = Date.now();
  const warnings: string[] = [];

  const email = String(data.email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    warnings.push('Dados Pessoais: Formato de email inválido');
  }

  const phone = String(data.telefone || '').trim();
  const digits = phone.replace(/\D/g, '');
  if (phone && digits.length > 0 && digits.length < 8) {
    warnings.push('Dados Pessoais: Número de telefone parece incompleto');
  }

  const experienceItems: SectionItem[] = (data.experiencias || []).map((exp) => ({
    id: uuidv4(),
    title: String(exp.cargo || '').trim(),
    subtitle: String(exp.empresa || '').trim(),
    date: formatPeriod(exp.inicio, exp.fim),
    description: String(exp.descricao || '').trim(),
    _meta: {
      title: createMeta(timestamp),
      subtitle: createMeta(timestamp),
      date: createMeta(timestamp),
      description: createMeta(timestamp),
    },
  }));

  const educationItems: SectionItem[] = (data.formacao || []).map((edu) => ({
    id: uuidv4(),
    title: String(edu.instituicao || '').trim(),
    subtitle: String(edu.curso || '').trim(),
    date: formatPeriod(edu.inicio, edu.fim),
    description: '',
    _meta: {
      title: createMeta(timestamp),
      subtitle: createMeta(timestamp),
      date: createMeta(timestamp),
    },
  }));

  const sections: Section[] = [
    {
      id: 'personal',
      type: 'personal',
      title: 'Dados Pessoais',
      visible: true,
      collapsed: false,
      fields: {
        fullName: String(data.nome || '').trim(),
        role: '',
        email: email,
        phone: phone,
        location: '',
        linkedin: String(data.linkedin || '').trim(),
      },
      _meta: {
        fullName: createMeta(timestamp),
        role: createMeta(timestamp),
        email: createMeta(timestamp),
        phone: createMeta(timestamp),
        location: createMeta(timestamp),
        linkedin: createMeta(timestamp),
      },
    },
    {
      id: 'summary',
      type: 'richtext',
      title: 'Resumo Profissional',
      visible: true,
      collapsed: false,
      content: String(data.resumo || '').trim(),
      _meta: { content: createMeta(timestamp) },
    },
    {
      id: 'experience',
      type: 'repeatable_group',
      title: 'Experiência Profissional',
      visible: true,
      collapsed: false,
      sortMode: 'auto',
      items: experienceItems,
    },
    {
      id: 'education',
      type: 'repeatable_group',
      title: 'Formação Acadêmica',
      visible: true,
      collapsed: false,
      sortMode: 'auto',
      items: educationItems,
    },
    {
      id: 'skills',
      type: 'list',
      title: 'Habilidades',
      visible: true,
      collapsed: false,
      list: uniqueList(data.habilidades || []),
      _meta: { list: createMeta(timestamp) },
    },
  ];

  return {
    id: uuidv4(),
    sections,
    metadata: {
      template: 'default',
      lastUpdated: new Date().toISOString(),
    },
    _parseWarnings: warnings,
  };
};
