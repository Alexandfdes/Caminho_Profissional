// supabase/functions/analyze-cv/prompts.ts
// Centralized prompt templates for CV analysis

/**
 * Build the autofill prompt for pure data extraction (no analysis)
 * This prompt extracts CV data for form auto-fill without scoring
 */
export const buildAutofillPrompt = (cvText: string): string => `
Você é um importador de currículos especializado em Data Entry (Entrada de Dados).
Sua ÚNICA função é:
1) Ler o currículo (texto e contexto visual das imagens).
2) Extrair os dados com precisão cirúrgica.
3) Normalizar formatos (datas, telefones).
4) Retornar o JSON para preenchimento automático do formulário.

NÃO faça análises, NÃO dê notas, NÃO julgue o candidato. Apenas extraia.

ANÁLISE MULTIMODAL (VISUAL):
- Use as imagens fornecidas para entender a hierarquia visual.
- Diferencie claramente: Títulos de Seção vs Cargos vs Empresas.
- Se o texto estiver confuso ou fora de ordem, confie no layout visual da imagem.
- Identifique colunas: Não misture texto da coluna da esquerda com a direita.

REGRAS DE EXTRAÇÃO:
- **Separação**: Cada experiência e cada formação deve ser um objeto distinto. Não agrupe.
- **Datas**: Tente padronizar para "MMM AAAA" (ex: "jan 2023"). Se for "Atualmente", use "Atual".
- **Contato**: Telefone deve conter apenas dígitos ou formato internacional (+55).
- **Resumo**: Se não houver seção "Resumo" ou "Sobre", deixe em branco ou gere uma frase descritiva baseada no último cargo.
- **Habilidades**: Liste como strings simples.

SCHEMA DE RESPOSTA (JSON OBRIGATÓRIO):
Retorne APENAS um JSON válido com esta estrutura exata:

{
  "patch": {
    "personal": {
      "fullName": "Nome Completo encontrado",
      "role": "Cargo atual ou título do CV",
      "email": "email@exemplo.com",
      "phone": "(XX) 9XXXX-XXXX",
      "location": "Cidade, Estado",
      "linkedin": "linkedin.com/in/usuario",
      "website": "portfolio.com",
      "github": "github.com/usuario"
    },
    "summaryHtml": "Texto do resumo (sem tags HTML complexas, apenas texto limpo)",
    "skills": ["Skill 1", "Skill 2", "Skill 3"],
    "experience": [
      {
        "title": "Cargo Ocupado",
        "subtitle": "Nome da Empresa",
        "date": "Inicio - Fim",
        "descriptionHtml": "Descrição das atividades (use bullet points se houver)"
      }
    ],
    "education": [
      {
        "title": "Nome do Curso/Graduação",
        "subtitle": "Instituição de Ensino",
        "date": "Ano de Conclusão ou Período"
      }
    ],
    "courses": [
      {
        "title": "Nome do Curso",
        "provider": "Instituição",
        "date": "Ano"
      }
    ],
    "projects": [
      {
        "title": "Nome do Projeto",
        "descriptionHtml": "Descrição breve",
        "url": "Link do projeto",
        "tech": ["Tech 1", "Tech 2"]
      }
    ]
  },
  "confidence": {
    "personal": 100,
    "experience": 100,
    "education": 100
  }
}

CONTEXTO DO CURRÍCULO (Texto extraído):
<<<
${cvText}
>>>
`;

/**
 * Build the extract prompt for structured CV data extraction
 */
export const buildExtractPrompt = (cvText: string): string => `Você é um extrator estruturado de currículo.

RETORNE APENAS JSON VÁLIDO (RFC 8259). NÃO use markdown. NÃO inclua comentários. NÃO inclua texto fora do JSON.

Use EXATAMENTE esta estrutura:
{
    "structured_cv": {
        "personal_info": { "name": "", "role": "", "location": "", "linkedin": "", "email": "", "phone": "" },
        "summary": "",
        "experience": [ { "company": "", "role": "", "period": "", "description": "" } ],
        "education": [ { "institution": "", "degree": "", "period": "" } ],
        "skills": []
    },
    "summary": "Resumo textual",
    "keywords": [],
    "overall_experience_years": 0,
    "primary_role": ""
}

TEXTO DO CURRÍCULO:
${cvText}
`;
