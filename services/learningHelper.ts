import { supabaseService } from './supabaseService';

/**
 * Helper function to enrich AI prompts with historical learning data
 * This allows the AI to learn from past user sessions and make better predictions
 */
export async function getHistoricalContext(userAge?: number, userState?: string): Promise<string> {
    try {
        // Get patterns from similar users
        const ageRange = userAge ? { min: userAge - 5, max: userAge + 5 } : undefined;
        const patterns = await supabaseService.getCareerPatterns(userState, ageRange);

        if (!patterns || patterns.length === 0) {
            return '';
        }

        // Aggregate common career choices
        const careerCounts: Record<string, number> = {};
        patterns.forEach((session: any) => {
            if (session.selected_career) {
                careerCounts[session.selected_career] = (careerCounts[session.selected_career] || 0) + 1;
            }
        });

        const topCareers = Object.entries(careerCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([career, count]) => `${career} (${count} usuários)`);

        const contextInfo = [];

        if (userState && topCareers.length > 0) {
            contextInfo.push(`\nDADOS HISTÓRICOS - Carreiras populares no estado ${userState}:\n${topCareers.join(', ')}`);
        }

        if (userAge && topCareers.length > 0) {
            contextInfo.push(`\nPadrões de usuários com idade similar (${userAge}±5 anos) mostram interesse em: ${topCareers.slice(0, 3).join(', ')}`);
        }

        contextInfo.push(`\n[Base de dados: ${patterns.length} sessões analisadas]`);

        return contextInfo.join('\n');
    } catch (error) {
        console.error('Erro ao buscar contexto histórico:', error);
        return '';
    }
}
