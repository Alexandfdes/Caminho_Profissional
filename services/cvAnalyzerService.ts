import { supabaseService } from './supabaseService';
import { pdfParserService } from './pdfParserService';
import { analyzeCVWithAI } from './geminiService';
import { CVAnalysis, CVAnalysisResult, CVUsageQuota } from '../types/cv';

function isCVAnalysis(value: any): value is CVAnalysis {
    return !!value && typeof value === 'object' && typeof value.overall_score === 'number' && Array.isArray(value.sections);
}

function isCVAnalysisResult(value: any): value is CVAnalysisResult {
    return !!value && typeof value === 'object' && typeof value.score === 'number' && typeof value.suggestions_by_section === 'object';
}

/**
 * Normalizes the Edge Function response into the CVAnalysis format used by the UI.
 *
 * Supports:
 * - Newer server response that already matches CVAnalysis (overall_score/sections)
 * - Older Gemini-style CVAnalysisResult (score/strengths/weaknesses/etc)
 */
function convertToAnalysisFormat(raw: any): CVAnalysis {
    // Most important: if the edge function already returns CVAnalysis, keep it.
    if (isCVAnalysis(raw)) {
        return raw;
    }

    if (!isCVAnalysisResult(raw)) {
        throw new Error('Formato de análise inesperado retornado pela IA.');
    }

    const geminiResult = raw as CVAnalysisResult;

    // Convert suggestions_by_section to sections format
    const suggestionsBySection = (geminiResult as any)?.suggestions_by_section;
    const entries: Array<[string, any]> =
        suggestionsBySection && typeof suggestionsBySection === 'object'
            ? Object.entries(suggestionsBySection)
            : [];

    const strengths = Array.isArray(geminiResult.strengths) ? geminiResult.strengths.filter((s) => typeof s === 'string') : [];
    const weaknesses = Array.isArray(geminiResult.weaknesses) ? geminiResult.weaknesses : [];
    const score = Number(geminiResult.score ?? 0);

    const sections = entries.map(([sectionName, suggestions]) => {
        // Normalize strings for comparison
        const normalizedSectionName = sectionName.toLowerCase();

        const normalizedSuggestions = Array.isArray(suggestions)
            ? suggestions.filter((s) => typeof s === 'string')
            : [];

        return {
            name: sectionName,
            score: score, // Use overall score as baseline
            // Strengths are global, so we don't filter them per section to avoid empty lists
            // We will show them in the "Análise Geral" or "Resumo"
            strengths: [],
            // Fix: Filter weaknesses by matching the 'section' field, not the suggestion text
            weaknesses: weaknesses
                .filter(w => w.section && w.section.toLowerCase().includes(normalizedSectionName))
                .map(w => w.suggestion)
                .slice(0, 5),
            suggestions: normalizedSuggestions
        };
    });

    // Always add "Análise Geral" to show global strengths and high-priority weaknesses
    sections.unshift({
        name: "Destaques & Pontos Críticos",
        score: score,
        strengths: strengths, // Show all strengths here
        weaknesses: weaknesses
            .filter(w => {
                // Only show critical weaknesses (priority 1)
                // AND filter out weaknesses that are already specific to a section (to avoid repetition)
                // If 'section' is generic like "Geral", "Layout", "Formatação", keep it.
                const isCritical = w.priority === 1;
                const isGeneric = !w.section || ['geral', 'layout', 'formatação', 'design', 'foto'].includes(w.section.toLowerCase());
                return isCritical && isGeneric;
            })
            .map(w => `${w.issue}: ${w.suggestion}`)
            .slice(0, 5),
        suggestions: [] // Suggestions are already in specific sections
    });

    return {
        overall_score: score,
        summary: geminiResult.notes || `Análise concluída com sucesso. Confira abaixo os detalhes por seção.`,
        sections: sections,
        red_flags: geminiResult.red_flags || [],
        structured_cv: geminiResult.structured_cv
    };
}

export interface CachedCVAnalysis {
    analysis: CVAnalysis;
    cacheKey: string;
    textHash: string;
    metadataHash: string;
    fromCache: boolean;
    cacheEnabled: boolean;
    cacheUsed: boolean;
    cvText?: string | string[]; // Store original CV text OR images for rendering
}

function normalizeText(input: string): string {
    return input.replace(/\s+/g, ' ').trim();
}

async function hashText(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

async function getCachedAnalysis(supabase: ReturnType<typeof supabaseService.getClient>, cacheKey: string) {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('resume_analysis_cache')
        .select('analysis_result')
        .eq('cache_key', cacheKey)
        .maybeSingle();

    if (error || !data) return null;
    return data.analysis_result as any;
}

async function cacheAnalysisResult(
    supabase: ReturnType<typeof supabaseService.getClient>,
    userId: string,
    payload: {
        cacheKey: string;
        textHash: string;
        metadataHash: string;
        metadata: Record<string, any>;
        analysis: any;
    }
) {
    if (!supabase) return;

    const { error } = await supabase
        .from('resume_analysis_cache')
        .upsert(
            {
                user_id: userId,
                cache_key: payload.cacheKey,
                text_hash: payload.textHash,
                metadata_hash: payload.metadataHash,
                metadata: payload.metadata,
                analysis_result: payload.analysis,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            { onConflict: 'cache_key' }
        );

    if (error) console.warn('⚠️ Não foi possível salvar cache da análise:', error.message);
}

export const cvAnalyzerService = {
    /**
     * Check user's analysis quota
     */
    async checkQuota(): Promise<CVUsageQuota> {
        const supabase = supabaseService.getClient();
        if (!supabase) throw new Error('Supabase não inicializado');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Get start and end of current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        // Count analyses in current month
        const { count, error } = await supabase
            .from('resume_analyses')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', startOfMonth)
            .lte('created_at', endOfMonth);

        if (error) {
            console.error('Error checking quota:', error);
            throw new Error('Erro ao verificar cota');
        }

        // TODO: Fetch limit from subscription tier
        // For now, hardcode limits: Free = 1, Premium = 10
        const isPremium = false; // Replace with actual check
        const maxAnalyses = isPremium ? 10 : 3; // Increased free limit for testing
        const currentCount = count || 0;

        return {
            current_month: now.toLocaleString('default', { month: 'long' }),
            analyses_count: currentCount,
            max_analyses: maxAnalyses,
            can_analyze: currentCount < maxAnalyses
        };
    },

    /**
     * Upload CV file to storage
     */
    async uploadCV(file: File): Promise<string> {
        const supabase = supabaseService.getClient();
        if (!supabase) throw new Error('Supabase não inicializado');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('cv-uploads')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Error uploading file:', uploadError);
            throw new Error('Erro ao fazer upload do arquivo');
        }

        return fileName;
    },

    /**
     * Create initial analysis record
     */
    async createAnalysis(
        filename: string,
        filePath: string,
        fileSize: number,
        fileType: 'pdf' | 'docx',
        optInSave: boolean
    ): Promise<string> {
        const supabase = supabaseService.getClient();
        if (!supabase) throw new Error('Supabase não inicializado');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('resume_analyses')
            .insert({
                user_id: user.id,
                filename,
                file_path: filePath,
                file_size: fileSize,
                file_type: fileType,
                opt_in_save: optInSave,
                status: 'processing',
                created_at: new Date().toISOString()
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating analysis record:', error);
            throw new Error('Erro ao criar registro de análise');
        }

        return data.id;
    },

    /**
     * Update analysis with results
     */
    async updateAnalysis(
        analysisId: string,
        result: CVAnalysisResult,
        extractedText?: string
    ): Promise<void> {
        const supabase = supabaseService.getClient();
        if (!supabase) throw new Error('Supabase não inicializado');

        const updateData: any = {
            analysis_result: result,
            score: result.score / 10, // Convert to 0-10 scale
            status: 'completed',
            completed_at: new Date().toISOString()
        };

        if (extractedText) {
            updateData.content_text = extractedText;
        }

        const { error } = await supabase
            .from('resume_analyses')
            .update(updateData)
            .eq('id', analysisId);

        if (error) {
            console.error('Error updating analysis:', error);
            throw new Error('Erro ao salvar resultados da análise');
        }
    },

    /**
     * Mark analysis as failed
     */
    async markAnalysisFailed(analysisId: string): Promise<void> {
        const supabase = supabaseService.getClient();
        if (!supabase) return;

        await supabase
            .from('resume_analyses')
            .update({
                status: 'failed',
                completed_at: new Date().toISOString()
            })
            .eq('id', analysisId);
    },

    /**
     * Upload and analyze a CV file (Client-side analysis)
     * @deprecated Use uploadCV + createAnalysis + updateAnalysis flow instead
     */
    async uploadAndAnalyze(file: File, userId: string, options?: { forceRefresh?: boolean }): Promise<CachedCVAnalysis> {
        try {
            console.log('💼 Iniciando análise de CV...');

            // 1. Extract text from PDF
            let extractedText = await pdfParserService.extractTextFromPDF(file);
            let cvContent: string | string[] = extractedText;

            console.log('✅ Texto extraído:', extractedText.length, 'caracteres');

            // Check if text is sufficient, otherwise try image conversion
            if (!extractedText || extractedText.length < 50) {
                console.warn('⚠️ Texto insuficiente. Tentando análise visual (OCR/Multimodal)...');
                try {
                    const images = await pdfParserService.convertPDFToImages(file);
                    if (images.length > 0) {
                        cvContent = images;
                        console.log('✅ PDF convertido para imagens para análise visual.');
                    } else {
                        throw new Error('Falha ao converter PDF para imagens.');
                    }
                } catch (imgError) {
                    console.error('❌ Falha na conversão de imagem:', imgError);
                    throw new Error('Não foi possível ler o conteúdo do PDF (Texto ou Imagem). Verifique o arquivo.');
                }
            }

            const forceRefresh = options?.forceRefresh ?? false;

            // Generate hash based on content type
            const contentForHash = Array.isArray(cvContent) ? JSON.stringify(cvContent) : cvContent;
            const normalizedContent = normalizeText(contentForHash);
            const textHash = await hashText(normalizedContent);

            const metadata = {
                fileName: file.name,
                fileSize: file.size,
                lastModified: file.lastModified
            };
            const metadataHash = await hashText(JSON.stringify(metadata));
            const cacheKey = await hashText(JSON.stringify({ textHash, metadataHash }));

            // 2. Analyze with Gemini AI (client-side)
            const supabaseClient = supabaseService.getClient();
            const cacheEnabled = Boolean(supabaseClient);
            if (supabaseClient && forceRefresh) {
                await supabaseService.clearResumeAnalysisCache({ cacheKey, userId });
            }
            if (supabaseClient) {
                const cachedResult = await getCachedAnalysis(supabaseClient, cacheKey);
                if (cachedResult) {
                    console.log('♻️  Usando análise em cache');
                    return {
                        analysis: convertToAnalysisFormat(cachedResult),
                        cacheKey,
                        textHash,
                        metadataHash,
                        fromCache: true,
                        cacheEnabled,
                        cacheUsed: true,
                        cvText: cvContent // Return content (text or images)
                    };
                }
            }

            console.log('🤖 Analisando com IA...');
            const geminiResult = await analyzeCVWithAI(cvContent);
            console.log('✅ Análise concluída:', geminiResult);

            // 3. Convert to component format
            const analysisResult = convertToAnalysisFormat(geminiResult);

            // 4. Save to Supabase (optional - for history)
            try {
                if (supabaseClient) {
                    await supabaseClient.from('resume_analyses').insert({
                        user_id: userId,
                        filename: file.name,
                        file_type: 'pdf',
                        analysis_result: geminiResult, // Save original format
                        score: ((geminiResult as any)?.overall_score ?? (geminiResult as any)?.score ?? 0) / 10, // Convert to 0-10 scale
                        created_at: new Date().toISOString()
                    });
                    console.log('✅ Análise salva no banco de dados');
                }
                if (supabaseClient) {
                    await cacheAnalysisResult(supabaseClient, userId, {
                        cacheKey,
                        textHash,
                        metadataHash,
                        metadata,
                        analysis: geminiResult
                    });
                }
            } catch (dbError) {
                console.warn('⚠️ Erro ao salvar no banco (não crítico):', dbError);
                // Don't fail the entire analysis if saving fails
            }

            return {
                analysis: analysisResult,
                cacheKey,
                textHash,
                metadataHash,
                fromCache: false,
                cacheEnabled,
                cacheUsed: false,
                cvText: cvContent // Return content (text or images)
            };
        } catch (error: any) {
            console.error('❌ CV Analysis error:', error);
            throw new Error(error.message || 'Erro ao analisar currículo');
        }
    },

    /**
     * Get analysis history for a user
     */
    async getAnalysisHistory(userId: string): Promise<any[]> {
        const supabase = supabaseService.getClient();
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('resume_analyses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching analysis history:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Delete an analysis
     */
    async deleteAnalysis(analysisId: string): Promise<void> {
        const supabase = supabaseService.getClient();
        if (!supabase) throw new Error('Supabase não inicializado');

        const { error } = await supabase
            .from('resume_analyses')
            .delete()
            .eq('id', analysisId);

        if (error) {
            console.error('Error deleting analysis:', error);
            throw new Error('Erro ao deletar análise');
        }
    },

    /**
     * Get all analyses (Admin only)
     */
    async getAllAnalyses(): Promise<any[]> {
        const supabase = supabaseService.getClient();
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('resume_analyses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all analyses:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Get all cache entries (Admin only)
     */
    async getAllCaches(): Promise<any[]> {
        const supabase = supabaseService.getClient();
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('resume_analysis_cache')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all caches:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Delete a cache entry (Admin only)
     */
    async deleteCache(cacheKey: string): Promise<void> {
        const supabase = supabaseService.getClient();
        if (!supabase) throw new Error('Supabase não inicializado');

        const { error } = await supabase
            .from('resume_analysis_cache')
            .delete()
            .eq('cache_key', cacheKey);

        if (error) {
            console.error('Error deleting cache:', error);
            throw new Error('Erro ao deletar cache');
        }
    }
};
