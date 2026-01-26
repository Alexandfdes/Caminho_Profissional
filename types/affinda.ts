export interface ResumeData {
    nome: string;
    email: string;
    telefone: string;
    linkedin: string;
    resumo: string;
    habilidades: string[];
    experiencias: Array<{ empresa: string; cargo: string; inicio: string; fim: string; descricao: string; }>;
    formacao: Array<{ instituicao: string; curso: string; inicio: string; fim: string; }>;
}

export const emptyResume: ResumeData = {
    nome: "", email: "", telefone: "", linkedin: "", resumo: "",
    habilidades: [], experiencias: [], formacao: []
};
