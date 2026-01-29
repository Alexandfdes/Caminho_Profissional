// OpenAI Provider
// GPT-5 implementation

import { AIProviderOptions } from './types.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

export const callOpenAI = async (
    prompt: string,
    opts?: AIProviderOptions
): Promise<string> => {
    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY não configurada');
    }

    const maxTokens = opts?.maxOutputTokens ?? 4096;
    const imageList = Array.isArray(opts?.images) ? opts.images : [];

    // Build messages with images if provided (GPT-5 Mini supports up to 5 images)
    const content: unknown[] = [{ type: 'text', text: prompt }];
    for (const img of imageList.slice(0, 5)) {
        if (typeof img === 'string' && img.trim()) {
            // Ensure proper data URL format
            const url = img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
            content.push({
                type: 'image_url',
                image_url: { url, detail: 'high' } // 'high' detail for better OCR accuracy
            });
        }
    }

    console.log('>>> callOpenAI: About to fetch, content items:', content.length);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-5-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Você é um assistente especializado em processamento de currículos. Sua tarefa é retornar APENAS o JSON no formato EXATO solicitado pelo usuário no prompt, sem markdown, sem comentários e sem textos adicionais. Se o prompt pede um campo "data", retorne "data". Se pede "experiencia", retorne "experiencia". Não traduza chaves do JSON.'
                },
                { role: 'user', content }
            ],
            max_completion_tokens: maxTokens,
            reasoning_effort: 'low',
            response_format: { type: 'json_object' }
        })
    });
    console.log('>>> callOpenAI: Fetch completed, status:', response.status);

    if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error status:', response.status);
        console.error('OpenAI API error body:', errorData);
        throw new Error(`Erro ao comunicar com OpenAI: ${response.status} - ${errorData.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log('>>> callOpenAI: JSON parsed, keys:', Object.keys(data));

    // GPT-5 can return in multiple formats
    let responseText = '';

    // Format 1: Standard chat completions (choices array)
    if (data?.choices?.[0]?.message?.content) {
        responseText = data.choices[0].message.content;
    }
    // Format 2: New responses API format (output array)
    else if (data?.output?.[0]?.content?.[0]?.text) {
        responseText = data.output[0].content[0].text;
    }
    // Format 3: Direct text field
    else if (data?.text) {
        responseText = data.text;
    }
    // Format 4: output_text field
    else if (data?.output_text) {
        responseText = data.output_text;
    }

    if (!responseText) {
        console.error('OpenAI response format not recognized:', JSON.stringify(data).substring(0, 800));
        throw new Error('Resposta vazia da OpenAI - formato não reconhecido');
    }

    console.log('OpenAI response text length:', responseText.length);
    return responseText;
};
