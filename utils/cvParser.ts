import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker - Use local worker to avoid CORS issues
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

console.log('🔧 PDF.js Worker configurado (local):', pdfjsLib.GlobalWorkerOptions.workerSrc);

export interface CVData {
    nome: string;
    email: string;
    telefone: string;
    linkedin: string;
    resumo: string;
    habilidades: string[];
    experiencias: Experience[];
    formacao: Education[];
}

export interface Experience {
    empresa: string;
    cargo: string;
    inicio: string;
    fim: string;
    descricao: string;
}

export interface Education {
    instituicao: string;
    curso: string;
    inicio: string;
    fim: string;
}

/**
 * Extract text from PDF file with line reconstruction
 */
export async function extractTextFromPDF(file: File): Promise<string> {
    try {
        console.log('📄 Iniciando extração de PDF:', file.name, 'Size:', file.size, 'bytes');

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let textContent = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();

            // Group by line using Y coordinate (transform[5])
            const linesMap = new Map<number, { x: number, str: string }[]>();

            content.items.forEach((item: any) => {
                const t = item.transform || [0, 0, 0, 0, 0, 0];
                const x = t[4];
                const y = t[5];
                // Tolerance for close lines
                const yKey = Math.round(y / 2);

                if (!linesMap.has(yKey)) {
                    linesMap.set(yKey, []);
                }
                linesMap.get(yKey)?.push({ x, str: item.str });
            });

            // Sort lines by Y (top to bottom - PDF coords usually grow upwards, so sort descending)
            const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);

            const pageLines = sortedY.map(yKey => {
                const parts = linesMap.get(yKey)?.sort((a, b) => a.x - b.x).map(p => p.str) || [];
                return parts.join(' ').trim();
            }).filter(Boolean);

            textContent += pageLines.join('\n') + '\n\n';
        }

        return textContent.trim();
    } catch (error: any) {
        console.error('❌ ERRO ao extrair PDF:', error);
        throw new Error('Não foi possível extrair o texto do PDF. ' + (error.message || ''));
    }
}

/**
 * Extract text from DOCX file
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });

        if (!result.value || result.value.trim().length === 0) {
            throw new Error('O documento DOCX está vazio ou não pôde ser lido.');
        }

        return result.value.trim();
    } catch (error) {
        console.error('Erro ao extrair texto do DOCX:', error);
        throw new Error('Não foi possível extrair o texto do DOCX.');
    }
}

/**
 * Extract text from CV file (auto-detect format)
 */
export async function extractTextFromCV(file: File): Promise<string> {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.pdf')) {
        return extractTextFromPDF(file);
    } else if (fileName.endsWith('.docx')) {
        return extractTextFromDOCX(file);
    } else {
        throw new Error('Formato de arquivo não suportado. Use PDF ou DOCX.');
    }
}

/**
 * Parse extracted text into structured CV data
 */
export function parseResumeText(text: string): CVData {
    const safe = normalizeText(text);

    const data: CVData = {
        nome: '',
        email: matchOne(safe, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i),
        telefone: matchOne(safe, /(\+?55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/),
        linkedin: matchOne(safe, /https?:\/\/(www\.)?linkedin\.com\/[^\s]+/i),
        resumo: extractSection(safe, /(Resumo|Perfil|Sobre)\s*[:\-]?/i, /(Experiên|Experien|Experiência|Experiências|Formação|Educação|Habilidades|Competências|Projetos)/i),
        habilidades: extractListSection(safe, /(Habilidades|Competências)\s*[:\-]?/i),
        experiencias: extractExperienciasRobusto(safe),
        formacao: extractFormacaoRobusto(safe)
    };

    // Nome heurístico
    const nomeLabel = matchOne(safe, /(Nome\s*[:\-]\s*)([^\n]+)/i, 2);
    if (nomeLabel) {
        data.nome = nomeLabel.trim();
    } else {
        const firstLine = safe.split('\n').map(l => l.trim()).find(l => l.length > 0);
        if (firstLine && firstLine.length < 80 && /^[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ][A-Za-zÁÀÃÂÉÊÍÓÔÕÚÇ\s'-.]+$/.test(firstLine)) {
            data.nome = firstLine;
        }
    }

    return data;
}

function normalizeText(text: string): string {
    return text
        .replace(/\r/g, '')
        .replace(/[•·●○◦▪■□\-–—]\s*/g, ' - ') // normaliza bullets
        .replace(/[ \t]+/g, ' ')
        .split('\n').map(l => l.trim()).join('\n').trim();
}

function matchOne(text: string, regex: RegExp, groupIndex = 0): string {
    const m = text.match(regex);
    return m ? m[groupIndex] : '';
}

function extractSection(text: string, startRegex: RegExp, nextHeaderRegex: RegExp): string {
    const start = text.search(startRegex);
    if (start === -1) return '';
    const rest = text.slice(start);
    const next = rest.search(nextHeaderRegex);
    return (next === -1 ? rest : rest.slice(0, next)).replace(startRegex, '').trim();
}

function extractListSection(text: string, headerRegex: RegExp): string[] {
    const sec = extractSection(text, headerRegex, /(Experiên|Experien|Formação|Educação|Projetos|Resumo|Perfil|Dados|Contato)/i);
    if (!sec) return [];
    return sec.split(/[\n,;]+/).map(s => s.replace(/^\-\s*/, '').trim()).filter(Boolean);
}

function extractExperienciasRobusto(text: string): Experience[] {
    const bloco = extractSection(text, /(Experiên|Experien|Experiência|Experiências)\s*[:\-]?/i, /(Formação|Educação|Habilidades|Competências|Projetos|Resumo|Perfil|Certificações)/i);
    if (!bloco) return [];

    const linhas = bloco.split('\n').map(l => l.trim()).filter(Boolean);
    const exp: Experience[] = [];
    let atual: Experience | null = null;

    linhas.forEach(l => {
        // Formatos comuns:
        // Empresa – Cargo (2019–2021)
        let m = l.match(/^(.*?)(\s[-–—]\s)(.*?)(\s*\((.*?)\))?$/);
        if (m) {
            if (atual) exp.push(atual);
            const period = (m[5] || '').trim();
            const anos = period.match(/(19|20)\d{2}/g);
            atual = {
                empresa: (m[1] || '').trim(),
                cargo: (m[3] || '').trim(),
                inicio: anos && anos[0] ? anos[0] : '',
                fim: anos && anos[1] ? anos[1] : (/(Atual|Presente)/i.test(period) ? 'Atual' : ''),
                descricao: ''
            };
            return;
        }

        // “Cargo em Empresa — mm/aaaa a mm/aaaa”
        m = l.match(/^(.+?)\s+em\s+(.+?)(\s[-–—]\s|,\s)?(.*)?$/i);
        if (m) {
            if (atual) exp.push(atual);
            const periodo = (m[4] || '').trim();
            const anos = periodo.match(/(19|20)\d{2}/g);
            atual = {
                cargo: (m[1] || '').trim(),
                empresa: (m[2] || '').trim(),
                inicio: anos && anos[0] ? anos[0] : '',
                fim: anos && anos[1] ? anos[1] : (/(Atual|Presente)/i.test(periodo) ? 'Atual' : ''),
                descricao: ''
            };
            return;
        }

        // Se for apenas uma linha descritiva, anexar à descrição
        if (!atual) {
            // Se for título (ex: "Jovem Aprendiz Administrativo"), iniciar item
            if (l.length < 80 && /[A-Za-zÁÀÃÂÉÊÍÓÔÕÚÇ]/.test(l) && !/@/.test(l)) {
                atual = { empresa: '', cargo: l, inicio: '', fim: '', descricao: '' };
            }
        } else {
            atual.descricao = (atual.descricao ? atual.descricao + ' ' : '') + l;
        }
    });

    if (atual) exp.push(atual);
    return exp;
}

function extractFormacaoRobusto(text: string): Education[] {
    const bloco = extractSection(text, /(Formação|Educação)\s*[:\-]?/i, /(Experiên|Experien|Habilidades|Competências|Projetos|Resumo|Perfil|Certificações)/i);
    if (!bloco) return [];

    const linhas = bloco.split('\n').map(l => l.trim()).filter(Boolean);
    const edu: Education[] = [];

    linhas.forEach(l => {
        // Instituição – Curso (Datas)
        let m = l.match(/^(.*?)(\s[-–—]\s)(.*?)(\s*\((.*?)\))?$/);
        const item: Education = { instituicao: '', curso: '', inicio: '', fim: '' };
        if (m) {
            item.instituicao = (m[1] || '').trim();
            item.curso = (m[3] || '').trim();
            const period = (m[5] || '').trim();
            const anos = period.match(/(19|20)\d{2}/g);
            if (anos && anos.length) { item.inicio = anos[0]; item.fim = anos[1] || ''; }
        } else {
            // “Curso em Instituição”
            m = l.match(/^(.+?)\s+em\s+(.+?)$/i);
            if (m) {
                item.curso = (m[1] || '').trim();
                item.instituicao = (m[2] || '').trim();
            } else {
                // Fallback: linha única vira curso
                item.curso = l;
            }
        }
        edu.push(item);
    });
    return edu;
}

/**
 * Validate extracted text quality
 */
export function validateExtractedText(text: string): { valid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
        return { valid: false, error: 'O texto extraído está vazio. Verifique se o arquivo não é uma imagem.' };
    }

    if (text.length < 50) {
        return { valid: false, error: 'O texto extraído é muito curto. Possível erro de leitura.' };
    }

    return { valid: true };
}
