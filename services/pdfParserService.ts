import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - Use local worker to avoid CORS issues
// pdfjs-dist v5 ships the worker as `build/pdf.worker.mjs` (minified variant
// may not exist depending on the installed version). Use the non-minified path
// for broader compatibility.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

console.log('🔧 [pdfParserService] PDF.js Worker configurado (local):', pdfjsLib.GlobalWorkerOptions.workerSrc);

export const pdfParserService = {
    /**
     * Extract text content from a PDF file
     */
    async extractTextFromPDF(file: File): Promise<string> {
        try {
            console.log('📄 [pdfParserService] Iniciando extração:', file.name, file.size, 'bytes');

            // Convert file to ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            console.log('✅ [pdfParserService] ArrayBuffer criado');

            // Load the PDF document
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            console.log('✅ [pdfParserService] PDF carregado. Páginas:', pdf.numPages);

            let fullText = '';

            // Extract text from each page, preserving line structure
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                // Group text items by Y coordinate to preserve line structure
                const linesMap = new Map<number, { x: number; str: string }[]>();

                textContent.items.forEach((item: any) => {
                    const t = item.transform || [0, 0, 0, 0, 0, 0];
                    const x = t[4];
                    const y = t[5];
                    // Tolerance for close lines (round to nearest 2 pixels)
                    const yKey = Math.round(y / 2);

                    if (!linesMap.has(yKey)) {
                        linesMap.set(yKey, []);
                    }
                    linesMap.get(yKey)?.push({ x, str: item.str });
                });

                // Sort lines by Y (top to bottom - PDF coords grow upwards, so sort descending)
                const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);

                // Build page text with proper line breaks
                const pageLines = sortedY.map(yKey => {
                    const parts = linesMap.get(yKey)?.sort((a, b) => a.x - b.x).map(p => p.str) || [];
                    return parts.join(' ').trim();
                }).filter(Boolean);

                fullText += pageLines.join('\n') + '\n\n';
            }

            console.log('✅ [pdfParserService] Extração completa:', fullText.length, 'caracteres');
            return fullText.trim();
        } catch (error: any) {
            console.error('❌ [pdfParserService] ERRO CAPTURADO:');
            console.error('   - Message:', error?.message || 'sem mensagem');
            console.error('   - Name:', error?.name || 'sem name');
            console.error('   - Stack:', error?.stack || 'sem stack');
            console.error('   - Full error object:', error);

            if (error.message && error.message.includes('worker')) {
                throw new Error('Erro ao inicializar o leitor de PDF. Tente recarregar a página.');
            } else if (error.message && error.message.includes('Invalid PDF')) {
                throw new Error('O arquivo PDF parece estar corrompido ou protegido por senha.');
            } else {
                throw new Error('Não foi possível extrair o texto do PDF. Verifique se o arquivo está correto.');
            }
        }
    },

    /**
     * Validate if file is a valid PDF
     */
    async validatePDF(file: File): Promise<boolean> {
        try {
            const arrayBuffer = await file.arrayBuffer();
            await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Convert first few pages of PDF to images (Base64)
     * Used as fallback for image-based PDFs
     */
    async convertPDFToImages(file: File, maxPages: number = 2): Promise<string[]> {
        try {
            console.log('🖼️ [pdfParserService] Convertendo PDF para imagens...');
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            const images: string[] = [];
            const pagesToConvert = Math.min(pdf.numPages, maxPages);

            for (let i = 1; i <= pagesToConvert; i++) {
                const page = await pdf.getPage(i);
                // Use scale 1.2 for reasonable quality without huge file size
                const viewport = page.getViewport({ scale: 1.2 });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (!context) continue;

                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                    canvas: canvas
                }).promise;

                // Convert to Base64 JPEG with lower quality to reduce size
                const base64Image = canvas.toDataURL('image/jpeg', 0.5);
                // Remove prefix "data:image/jpeg;base64," for Gemini API
                const cleanBase64 = base64Image.split(',')[1];

                // Log size for debugging
                console.log(`📄 [pdfParserService] Página ${i}: ~${Math.round(cleanBase64.length / 1024)}KB`);

                images.push(cleanBase64);
            }

            console.log(`✅ [pdfParserService] ${images.length} páginas convertidas em imagens.`);
            return images;
        } catch (error) {
            console.error('❌ [pdfParserService] Erro ao converter PDF para imagens:', error);
            throw new Error('Falha ao processar visualmente o PDF.');
        }
    }
};
