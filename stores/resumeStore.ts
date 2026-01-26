import { create } from 'zustand';
import { EditableCV, Section, SectionType, SectionItem, CVAnalysis } from '../types/cv';
import { v4 as uuidv4 } from 'uuid';

interface ResumeState {
    cvData: EditableCV;
    suggestions: CVAnalysis | null;
    isPristine: boolean;
    parseWarnings: string[];

    setCVData: (data: EditableCV, isPristine?: boolean) => void;
    setSuggestions: (analysis: CVAnalysis | null) => void;
    markAsEdited: () => void;

    addSection: (type: SectionType, title: string) => void;
    removeSection: (id: string) => void;
    updateSection: (id: string, data: Partial<Section>) => void;
    reorderSections: (sections: Section[]) => void;

    addSectionItem: (sectionId: string, initialData?: any) => void;
    removeSectionItem: (sectionId: string, itemId: string) => void;
    updateSectionItem: (sectionId: string, itemId: string, data: any) => void;
    reorderSectionItems: (sectionId: string, items: SectionItem[]) => void;
}

const initialSections: Section[] = [
    {
        id: 'personal',
        type: 'personal',
        title: 'Dados Pessoais',
        visible: true,
        collapsed: false,
        fields: {
            photo: '',
            firstName: '',
            lastName: '',
            role: '',
            useRoleAsTitle: false,
            email: '',
            phone: '',
            address: '',
            zipCode: '',
            city: '',
            birthDate: '',
            driversLicense: '',
            nationality: '',
            gender: '',
            civilStatus: '',
            website: '',
            linkedin: '',
            github: ''
        }
    },
    {
        id: 'summary',
        type: 'richtext',
        title: 'Resumo Profissional',
        visible: true,
        collapsed: false,
        content: ''
    },
    {
        id: 'experience',
        type: 'repeatable_group',
        title: 'Experiência Profissional',
        visible: true,
        collapsed: false,
        sortMode: 'auto',
        items: []
    },
    {
        id: 'education',
        type: 'repeatable_group',
        title: 'Formação Acadêmica',
        visible: true,
        collapsed: false,
        sortMode: 'auto',
        items: []
    },
    {
        id: 'courses',
        type: 'repeatable_group',
        title: 'Cursos Complementares',
        visible: true,
        collapsed: false,
        sortMode: 'auto',
        items: []
    },
    {
        id: 'projects',
        type: 'repeatable_group',
        title: 'Projetos',
        visible: true,
        collapsed: false,
        sortMode: 'auto',
        items: []
    },
    {
        id: 'skills',
        type: 'list',
        title: 'Habilidades',
        visible: true,
        collapsed: false,
        list: []
    }
];

const initialCVData: EditableCV = {
    id: uuidv4(),
    sections: initialSections,
    metadata: {
        template: 'default',
        lastUpdated: new Date().toISOString()
    },
    _parseWarnings: []
};

export const useResumeStore = create<ResumeState>((set) => ({
    cvData: initialCVData,
    suggestions: null,
    isPristine: true,
    parseWarnings: [],

    setCVData: (data, isPristine = false) => set({
        cvData: data,
        isPristine,
        parseWarnings: data._parseWarnings || []
    }),

    setSuggestions: (analysis) => set({ suggestions: analysis }),

    markAsEdited: () => set({ isPristine: false }),

    addSection: (type, title) => set((state) => ({
        isPristine: false,
        cvData: {
            ...state.cvData,
            sections: [
                ...state.cvData.sections,
                {
                    id: uuidv4(),
                    type,
                    title,
                    visible: true,
                    collapsed: false,
                    isCustom: true,
                    sortMode: type === 'repeatable_group' ? 'manual' : undefined,
                    items: type === 'repeatable_group' ? [] : undefined,
                    list: type === 'list' ? [] : undefined,
                    content: type === 'richtext' ? '' : undefined
                }
            ]
        }
    })),

    removeSection: (id) => set((state) => ({
        isPristine: false,
        cvData: {
            ...state.cvData,
            sections: state.cvData.sections.filter(s => s.id !== id)
        }
    })),

    updateSection: (id, data) => set((state) => {
        // Helper to update metadata
        const updateMeta = (section: Section, changes: Partial<Section>) => {
            const newMeta = { ...section._meta };
            const timestamp = Date.now();

            if (changes.fields) {
                Object.keys(changes.fields).forEach(key => {
                    if (section.fields?.[key] !== changes.fields?.[key]) {
                        newMeta[key] = { source: 'user-edited', timestamp };
                    }
                });
            }
            if (changes.content && changes.content !== section.content) {
                newMeta.content = { source: 'user-edited', timestamp };
            }
            if (changes.list && JSON.stringify(changes.list) !== JSON.stringify(section.list)) {
                newMeta.list = { source: 'user-edited', timestamp };
            }
            return newMeta;
        };

        return {
            isPristine: false,
            cvData: {
                ...state.cvData,
                sections: state.cvData.sections.map(s =>
                    s.id === id ? { ...s, ...data, _meta: updateMeta(s, data) } : s
                )
            }
        };
    }),

    reorderSections: (newSections) => set((state) => ({
        isPristine: false,
        cvData: {
            ...state.cvData,
            sections: newSections
        }
    })),

    addSectionItem: (sectionId, initialData = {}) => set((state) => ({
        isPristine: false,
        cvData: {
            ...state.cvData,
            sections: state.cvData.sections.map(s => {
                if (s.id !== sectionId || !s.items) return s;
                return {
                    ...s,
                    items: [
                        ...s.items,
                        { id: uuidv4(), ...initialData, _meta: {} }
                    ]
                };
            })
        }
    })),

    removeSectionItem: (sectionId, itemId) => set((state) => ({
        isPristine: false,
        cvData: {
            ...state.cvData,
            sections: state.cvData.sections.map(s => {
                if (s.id !== sectionId || !s.items) return s;
                return {
                    ...s,
                    items: s.items.filter(i => i.id !== itemId)
                };
            })
        }
    })),

    updateSectionItem: (sectionId, itemId, data) => set((state) => ({
        isPristine: false,
        cvData: {
            ...state.cvData,
            sections: state.cvData.sections.map(s => {
                if (s.id !== sectionId || !s.items) return s;
                return {
                    ...s,
                    items: s.items.map(i => {
                        if (i.id !== itemId) return i;

                        // Update item metadata
                        const newMeta = { ...i._meta };
                        const timestamp = Date.now();
                        Object.keys(data).forEach(key => {
                            if (key !== '_meta' && i[key] !== data[key]) {
                                newMeta[key] = { source: 'user-edited', timestamp };
                            }
                        });

                        return { ...i, ...data, _meta: newMeta };
                    })
                };
            })
        }
    })),

    reorderSectionItems: (sectionId, newItems) => set((state) => ({
        isPristine: false,
        cvData: {
            ...state.cvData,
            sections: state.cvData.sections.map(s => {
                if (s.id !== sectionId) return s;
                return { ...s, items: newItems };
            })
        }
    }))
}));
