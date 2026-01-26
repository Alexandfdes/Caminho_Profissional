import { EditableCV } from '../types/cv';

// Mock service - in a real app, this would call your backend
export const parserService = {
    getParsedResume: async (resumeId: string): Promise<any | null> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Check if we have stored analysis in localStorage (simulating DB)
        const storedAnalysis = localStorage.getItem(`analysis_${resumeId}`);
        if (storedAnalysis) {
            try {
                const parsed = JSON.parse(storedAnalysis);
                return parsed.structured_cv || null;
            } catch (e) {
                console.error('Error parsing stored resume:', e);
                return null;
            }
        }
        return null;
    },

    saveDraft: async (resumeId: string, data: EditableCV) => {
        localStorage.setItem(`draft_${resumeId}`, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    },

    getDraft: async (resumeId: string): Promise<{ data: EditableCV, timestamp: number } | null> => {
        const draft = localStorage.getItem(`draft_${resumeId}`);
        if (draft) {
            return JSON.parse(draft);
        }
        return null;
    }
};
