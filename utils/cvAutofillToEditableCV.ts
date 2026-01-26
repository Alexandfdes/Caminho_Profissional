import { v4 as uuidv4 } from 'uuid';
import { EditableCV, Section } from '../types/cv';
import { CVAutofillResult } from '../types/cvAutofill';

function ensureSection(sections: Section[], spec: Pick<Section, 'id' | 'type' | 'title'>): Section[] {
  const existing = sections.find((s) => s.id === spec.id);
  if (existing) {
    return sections.map((s) => (s.id === spec.id ? { ...s, title: spec.title } : s));
  }
  const base: Section = {
    id: spec.id,
    type: spec.type,
    title: spec.title,
    visible: true,
    collapsed: false,
    sortMode: spec.type === 'repeatable_group' ? 'auto' : undefined,
    items: spec.type === 'repeatable_group' ? [] : undefined,
    list: spec.type === 'list' ? [] : undefined,
    content: spec.type === 'richtext' ? '' : undefined,
    fields: spec.type === 'personal' ? {} : undefined,
  };
  return [...sections, base];
}

export function mapAutofillToEditableCV(base: EditableCV, autofill: CVAutofillResult): EditableCV {
  const patch = autofill.patch;
  let sections = [...(base.sections || [])];

  sections = ensureSection(sections, { id: 'personal', type: 'personal', title: 'Dados Pessoais' });
  sections = ensureSection(sections, { id: 'summary', type: 'richtext', title: 'Resumo Profissional' });
  sections = ensureSection(sections, { id: 'skills', type: 'list', title: 'Habilidades' });
  sections = ensureSection(sections, { id: 'experience', type: 'repeatable_group', title: 'Experiência Profissional' });
  sections = ensureSection(sections, { id: 'education', type: 'repeatable_group', title: 'Formação Acadêmica' });
  sections = ensureSection(sections, { id: 'courses', type: 'repeatable_group', title: 'Cursos Complementares' });
  sections = ensureSection(sections, { id: 'projects', type: 'repeatable_group', title: 'Projetos' });

  const withPersonal = sections.map((s) => {
    if (s.id !== 'personal') return s;
    const prev = s.fields || {};
    return {
      ...s,
      fields: {
        ...prev,
        fullName: patch.personal.fullName || `${patch.personal.firstName || ''} ${patch.personal.lastName || ''}`.trim() || '',
        firstName: patch.personal.firstName || patch.personal.fullName?.split(' ')[0] || '',
        lastName: patch.personal.lastName || patch.personal.fullName?.split(' ').slice(1).join(' ') || '',
        role: patch.personal.role || '',
        useRoleAsTitle: patch.personal.useRoleAsTitle ?? false,
        email: patch.personal.email || '',
        phone: patch.personal.phone || '',
        location: patch.personal.location || '',
        address: patch.personal.address || '',
        zipCode: patch.personal.zipCode || '',
        city: patch.personal.city || '',
        birthDate: patch.personal.birthDate || '',
        driversLicense: patch.personal.driversLicense || '',
        nationality: patch.personal.nationality || '',
        gender: patch.personal.gender || '',
        civilStatus: patch.personal.civilStatus || '',
        linkedin: patch.personal.linkedin || '',
        website: patch.personal.website || (patch.personal as any).github || '',
      },
    };
  });

  const withSummary = withPersonal.map((s) => {
    if (s.id !== 'summary') return s;
    return { ...s, content: patch.summaryHtml || '' };
  });

  const withSkills = withSummary.map((s) => {
    if (s.id !== 'skills') return s;
    const list = (patch.skills || []).filter(Boolean);
    return { ...s, list: list.length > 0 ? list : [] };
  });

  const mapGroupItem = (it: { title: string; subtitle: string; date: string; descriptionHtml: string }) => ({
    id: uuidv4(),
    title: it.title || '',
    subtitle: it.subtitle || '',
    date: it.date || '',
    description: it.descriptionHtml || '',
    _meta: {
      title: { source: 'parsed:file' as const, timestamp: Date.now() },
      subtitle: { source: 'parsed:file' as const, timestamp: Date.now() },
      date: { source: 'parsed:file' as const, timestamp: Date.now() },
      description: { source: 'parsed:file' as const, timestamp: Date.now() },
    },
  });

  const withExperience = withSkills.map((s) => {
    if (s.id !== 'experience') return s;
    return { ...s, items: (patch.experience || []).map(mapGroupItem) };
  });

  const withEducation = withExperience.map((s) => {
    if (s.id !== 'education') return s;
    return { ...s, items: (patch.education || []).map(mapGroupItem) };
  });

  const withCourses = withEducation.map((s) => {
    if (s.id !== 'courses') return s;
    const items = (patch.courses || []).map((c) => ({
      id: uuidv4(),
      title: c.title || '',
      subtitle: c.provider || '',
      date: c.date || '',
      description: '',
      _meta: {
        title: { source: 'parsed:file' as const, timestamp: Date.now() },
        subtitle: { source: 'parsed:file' as const, timestamp: Date.now() },
        date: { source: 'parsed:file' as const, timestamp: Date.now() },
      },
    }));
    return { ...s, sortMode: 'manual', items };
  });

  const withProjects = withCourses.map((s) => {
    if (s.id !== 'projects') return s;
    const items = (patch.projects || []).map((p) => {
      const url = (p.url || '').trim();
      const linkHtml = url ? `<p><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></p>` : '';
      const description = (p.descriptionHtml || '').trim();
      return {
        id: uuidv4(),
        title: p.title || '',
        subtitle: '',
        date: (p as any).date || '',
        description: `${linkHtml}${description}`.trim(),
        url,
        tech: Array.isArray(p.tech) ? p.tech : [],
        _meta: {
          title: { source: 'parsed:file' as const, timestamp: Date.now() },
          description: { source: 'parsed:file' as const, timestamp: Date.now() },
        },
      };
    });
    return { ...s, sortMode: 'manual', items };
  });

  return {
    ...base,
    sections: withProjects as Section[],
    metadata: {
      ...base.metadata,
      lastUpdated: new Date().toISOString(),
    },
    _parseWarnings: Array.isArray(autofill.warnings) ? autofill.warnings : [],
  };
}
