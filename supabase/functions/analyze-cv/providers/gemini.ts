// Gemini AI Provider
// Google Generative AI implementation

import { AIProviderOptions } from './types.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('GEMINIAPIKEY');

export const callGemini = async (
    prompt: string,
    opts?: AIProviderOptions
): Promise<string> => {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY não configurada');
    }

    const temperature = opts?.temperature ?? 0.4;
    const maxOutputTokens = opts?.maxOutputTokens ?? 3072;

    const imageList = Array.isArray(opts?.images) ? opts.images : [];
    const parts: unknown[] = [{ text: prompt }];

    // Gemini expects pure base64 without the data URL header
    for (const img of imageList.slice(0, 5)) {
        if (typeof img === 'string' && img.trim()) {
            // Strip data URL header if present (e.g., "data:image/jpeg;base64,")
            const base64Data = img.includes('base64,') ? img.split('base64,')[1] : img;
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
        }
    }

    const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                    temperature,
                    maxOutputTokens,
                    responseMimeType: 'application/json',
                }
            })
        }
    );

    if (!geminiResponse.ok) {
        const errorData = await geminiResponse.text();
        console.error('Gemini API error:', errorData);
        throw new Error('Erro ao comunicar com a IA');
    }

    const geminiData = await geminiResponse.json();

    const blockReason = geminiData?.promptFeedback?.blockReason;
    if (blockReason) {
        console.error('Gemini blocked response:', blockReason);
        throw new Error(`IA bloqueou a resposta (blockReason=${String(blockReason)})`);
    }

    const responseParts = geminiData?.candidates?.[0]?.content?.parts;
    const responseText = Array.isArray(responseParts)
        ? responseParts.map((p: { text?: string }) => p?.text).filter(Boolean).join('\n')
        : responseParts?.[0]?.text;

    if (!responseText) {
        throw new Error('Resposta vazia da IA');
    }

    return responseText;
};
