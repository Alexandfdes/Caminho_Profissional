import{serve as Ze}from"https://deno.land/std@0.168.0/http/server.ts";import{createClient as _e}from"https://esm.sh/@supabase/supabase-js@2";var Ee=Deno.env.get("GEMINI_API_KEY")??Deno.env.get("GEMINIAPIKEY"),re=Deno.env.get("SUPABASE_URL")??Deno.env.get("SUPABASEURL"),ve=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??Deno.env.get("SUPABASESERVICEROLEKEY"),xe=Deno.env.get("SUPABASE_ANON_KEY")??Deno.env.get("SUPABASEANONKEY"),Qe=C=>{let H=C.headers.get("origin")??"";return{"Access-Control-Allow-Origin":new Set(["http://localhost:3000","http://localhost:3001","http://localhost:3002","http://localhost:5173","http://localhost:4173","http://127.0.0.1:3000","http://127.0.0.1:3001","http://127.0.0.1:3002","http://127.0.0.1:5173","http://127.0.0.1:4173"]).has(H)?H:"*",Vary:"Origin","Access-Control-Allow-Headers":["authorization","apikey","content-type","x-client-info","accept","accept-language","cache-control","pragma"].join(", "),"Access-Control-Allow-Methods":"POST, OPTIONS"}};Ze(async C=>{let H=Qe(C),O=crypto.randomUUID();if(C.method==="OPTIONS")return new Response(null,{headers:H,status:204});let v=(T,S)=>new Response(JSON.stringify(S),{headers:{...H,"Content-Type":"application/json"},status:T});try{let T=await C.json(),{text:S,images:P,filename:oe,targetCareer:V,extractOnly:we,mode:Ne}=T??{},ne=String(Ne||"").toLowerCase()==="autofill",b=ne?"autofill":!!we&&!ne?"extract":"analysis",x=typeof S=="string"&&S.trim().length>0,z=Array.isArray(P)&&P.length>0,$=x?((s,t=12e3)=>{let r=String(s||"").trim();if(r.length<=t)return r;let e=r.slice(0,Math.floor(t*.6)),c=r.slice(-Math.floor(t*.4));return`${e}

[...]

${c}`})(S):"";if(!x&&!z&&b!=="autofill")return v(400,{error:"Missing required fields",error_code:"BAD_REQUEST",request_id:O});if(!Ee)throw new Error("GEMINI_API_KEY not configured");if(!re||!xe)throw new Error("SUPABASE_URL/SUPABASE_ANON_KEY not configured");let ae=C.headers.get("authorization")||C.headers.get("Authorization");if(!ae)return v(401,{error:"not authenticated",error_code:"UNAUTHORIZED",request_id:O});let ie=_e(re,xe,{global:{headers:{Authorization:ae}},auth:{persistSession:!1}}),{data:ce,error:Oe}=await ie.auth.getUser();if(Oe||!ce?.user)return v(401,{error:"not authenticated",error_code:"UNAUTHORIZED",request_id:O});let Re=ce.user.id,je=s=>({ok:!1,applyMode:"replace",patch:{personal:{fullName:"",role:"",email:"",phone:"",location:"",linkedin:"",github:"",website:""},summaryHtml:"<p></p>",skills:[],experience:[],education:[],courses:[],projects:[]},confidence:{personal:0,summary:0,skills:0,experience:0,education:0,courses:0,projects:0},warnings:Array.isArray(s)?s:[]});if(b==="autofill"&&(typeof S=="string"?String(S).trim().length:0)<200&&!z)return v(200,je(["CV_TEXT ausente ou muito curto"]));let{data:Y,error:le}=await ie.rpc("check_and_increment_gemini_usage",{p_request_type:"cv"});if(le)throw console.error("Usage RPC error:",le),new Error("Falha ao validar limite de uso");if(!(Array.isArray(Y)?Y[0]:Y)?.allowed)return v(429,{error:"Limite di\xE1rio de requisi\xE7\xF5es atingido (1.500/dia). Por favor, aguarde at\xE9 amanh\xE3.",error_code:"DAILY_LIMIT_REACHED",request_id:O});let ue=async(s,t)=>{let r=t?.temperature??.4,e=t?.maxOutputTokens??3072,c=Array.isArray(t?.images)?t.images:[],a=[{text:s}];for(let l of c.slice(0,3))typeof l=="string"&&l.trim()&&a.push({inlineData:{mimeType:"image/jpeg",data:l}});let g=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${Ee}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:a}],generationConfig:{temperature:r,maxOutputTokens:e,responseMimeType:"application/json"}})});if(!g.ok){let l=await g.text();throw console.error("Gemini API error:",l),new Error("Erro ao comunicar com a IA")}let f=await g.json(),i=f?.promptFeedback?.blockReason;if(i)throw console.error("Gemini blocked response:",i),new Error(`IA bloqueou a resposta (blockReason=${String(i)})`);let d=f?.candidates?.[0]?.content?.parts,w=Array.isArray(d)?d.map(l=>l?.text).filter(Boolean).join(`
`):d?.[0]?.text;if(!w)throw new Error("Resposta vazia da IA");return w},me=s=>`
Voc\xEA \xE9 um importador de curr\xEDculos que:
1) L\xEA o curr\xEDculo (texto e, quando necess\xE1rio, contexto das imagens das p\xE1ginas).
2) Interpreta entidades de curr\xEDculo (nome, contatos, links, cargos, empresas, datas, forma\xE7\xF5es, compet\xEAncias, etc.).
3) Normaliza datas, cargos, empresas e n\xEDveis de escolaridade.
4) Retorna os dados **exatamente** no JSON especificado adiante.
5) Gera um **preview textual** seguindo o **layout e estilo** abaixo (sem HTML, apenas texto com quebras de linha), com as mesmas se\xE7\xF5es e ordem.

AN\xC1LISE MULTIMODAL:
- SE imagens do PDF forem fornecidas, USE-AS como fonte PRIM\xC1RIA para entender o layout e estrutura visual do curr\xEDculo.
- O texto bruto pode ter problemas de extra\xE7\xE3o (texto junto, ordem errada). As imagens mostram a formata\xE7\xE3o real.
- Compare texto e imagem: confie mais na imagem para entender ONDE cada informa\xE7\xE3o est\xE1 posicionada.
- Identifique se\xE7\xF5es visuais (cabe\xE7alhos, colunas, divis\xF5es) pela imagem para separar corretamente os dados.

REGRAS CR\xCDTICAS DE SEPARA\xC7\xC3O:
- **EXPERI\xCANCIA**: CADA emprego/cargo diferente DEVE ser um objeto SEPARADO no array "experiencia". 
  Se a pessoa trabalhou em 2 empresas, devem existir 2 objetos. Se trabalhou 3 vezes, 3 objetos.
  Identifique mudan\xE7as de empresa/cargo analisando: nomes de empresas, cargos diferentes, ou datas que n\xE3o se sobrep\xF5em.
- **FORMA\xC7\xC3O**: CADA curso/forma\xE7\xE3o diferente DEVE ser um objeto SEPARADO no array "formacao".
  Se a pessoa tem ensino m\xE9dio + gradua\xE7\xE3o, devem existir 2 objetos. Mestrado = +1 objeto.
  Identifique forma\xE7\xF5es diferentes por: tipo (ensino m\xE9dio, gradua\xE7\xE3o, p\xF3s), institui\xE7\xF5es diferentes, ou cursos diferentes.
- N\xC3O junte m\xFAltiplas experi\xEAncias ou forma\xE7\xF5es em um \xFAnico objeto. Mesmo que o texto original esteja "colado", separe cada item.

IMPORTANTE:
- N\xC3O invente dados. Se faltar algo, deixe vazio ou omita o campo, conforme o schema.
- Conserte pequenos problemas comuns: emails com espa\xE7os, telefones com s\xEDmbolos, datas abreviadas ou \u201Cpresent/atual\u201D.
- Padronize **idioma PT-BR** (ex.: mai, jun, set; \u201CCursando, previs\xE3o de conclus\xE3o em AAAA\u201D).
- Use **capitaliza\xE7\xE3o consistente** para nomes pr\xF3prios e cargos (T\xEDtulo de Se\xE7\xE3o com Primeira Letra Mai\xFAscula; conte\xFAdo normal).
- Remova duplicatas entre Experi\xEAncia e Projetos/Atividades, mantendo a vers\xE3o mais completa.
- Links: sempre normalize (\`https://...\`) sem espa\xE7os.
- Telefone: se poss\xEDvel, normalize para \`(84) 9 - 96658951\` (com espa\xE7os ao redor do h\xEDfen, como no preview).
- Nunca retorne texto fora dos campos especificados.

[CONTEXT]
PDF_TEXT_BRUTO:
${s}

[TAREFA]
1) Extraia e normalize os dados do curr\xEDculo e retorne no JSON no campo \`data\`.
2) Gere o **preview** de exibi\xE7\xE3o no campo \`preview_text\`, com a formata\xE7\xE3o a seguir.

[ESQUEMA JSON DE SA\xCDDA]
Retorne **apenas** um JSON com esta estrutura:

{
  "data": {
    "pessoais": {
      "nome": "string",
      "sobrenome": "string",
      "email": "string",
      "telefone": "string",
      "cidade": "string",
      "estado": "string",
      "endereco": "string",
      "cep": "string",
      "links": {
        "site": "string",
        "github": "string",
        "linkedin": "string",
        "portfolio": "string"
      },
      "data_nascimento": "AAAA-MM-DD | string",
      "nacionalidade": "string",
      "genero": "string",
      "estado_civil": "string",
      "habilitacao": "string"
    },
    "resumo": "string", 
    "competencias": [ "string" ],
    "idiomas": [ { "idioma": "string", "nivel": "string" } ],
    "formacao": [
      {
        "curso": "string",
        "instituicao": "string",
        "nivel": "string", 
        "inicio": "AAAA-MM | string",
        "fim": "AAAA-MM | string",
        "situacao": "conclu\xEDdo | cursando | trancado | incompleto | string",
        "observacao": "ex.: "Cursando, previs\xE3o de conclus\xE3o em AAAA""
      }
    ],
    "experiencia": [
      {
        "cargo": "string",
        "empresa": "string",
        "inicio": "AAAA-MM",
        "fim": "AAAA-MM | "atual"",
        "local": "string",
        "descricao": [
          "bullet 1"
        ],
        "tipo": "tempo integral | est\xE1gio | freelancer | string"
      }
    ],
    "cursos": [
      {
        "titulo": "string",
        "instituicao": "string",
        "ano": "AAAA | string",
        "carga_horaria": "string"
      }
    ],
    "projetos": [
      {
        "titulo": "string",
        "link": "string",
        "descricao": "string",
        "stack": [ "string" ]
      }
    ],
    "certificados": [
      { "titulo": "string", "instituicao": "string", "ano": "AAAA | string" }
    ],
    "interesses": [ "string" ],
    "qualidades": [ "string" ],
    "referencias": [
      { "nome": "string", "contato": "string", "observacao": "string" }
    ]
  },

  "preview_text": "string grande com quebras de linha seguindo o layout abaixo"
}

[REGRAS DE NORMALIZA\xC7\xC3O]
- Datas:
  - Converter meses para abrevia\xE7\xF5es PT-BR: jan, fev, mar, abr, mai, jun, jul, ago, set, out, nov, dez.
  - Per\xEDodos: "mai 2024 - set 2025" (espa\xE7os ao redor do h\xEDfen).
  - Se atual, usar: "mai 2024 - atual".
- Telefone: se poss\xEDvel, formato \u201C(DD) 9 - NNNNNNN\u201D.
- URLs: remover espa\xE7os, for\xE7ar https:// quando aplic\xE1vel.
- Texto: remover lixo de OCR e espa\xE7os extras; preservar acentua\xE7\xE3o.

[LAYOUT DO PREVIEW \u2014 EXATAMENTE NESTA ORDEM E ESTILO]
- Primeira linha: Nome completo (todas as partes, com espa\xE7os simples).
- Se\xE7\xE3o "Dados pessoais"
  - Nome completo (repetir)
  - email com espa\xE7os \u201Cprotetores\u201D (ex.: \`nome @ dominio . com\`)
  - telefone como \u201C( 84 )  9  -  96658951\u201D (espa\xE7os ao redor do h\xEDfen; espa\xE7os simples entre tokens)
  - \u201CCidade :  Mossor\xF3  -  RN  Mossor\xF3\u201D quando houver cidade/estado; se houver endere\xE7o/CEP, n\xE3o exibir no preview, apenas cidade/estado.
  - links em linhas separadas (ex.: \`github . com/usuario\`, \`linkedin . com/in/slug\`)
- Se\xE7\xE3o "Compet\xEAncias"
  - Listar em linhas, uma por linha, mantendo capitaliza\xE7\xE3o simples (Java, Spring Boot, MySQL\u2026)
- Se\xE7\xE3o "Forma\xE7\xE3o"
  - Um item por bloco: 
    - linha 1: n\xEDvel/descri\xE7\xE3o (ex.: \u201CEnsino m\xE9dio completo  2024  DIOCESANO SANTA LUZIA\u201D)
    - linha 2 (se estiver cursando): \u201CCi\xEAncia da Computa\xE7\xE3o  2028  Universidade Potiguar (UNP)  Cursando, previs\xE3o de conclus\xE3o em 2028\u201D
- Se\xE7\xE3o "Experi\xEAncia"
  - Cabe\xE7alho do cargo (uma linha): \u201CDesenvolvedor  mai 2024  -  set 2025  F. souto\u201D
  - Descri\xE7\xE3o em par\xE1grafos curtos ou bullets concatenados em linhas (sem marcadores de \u201C-\u201D ou \u201C\u2022\u201D, apenas frases por linha).
- Se\xE7\xE3o "Cursos"
  - Uma linha por curso, com \u201CBaixe seu curr\xEDculo em www.cvwizard.com\u201D se for aplic\xE1vel (apenas se constar no curr\xEDculo; n\xE3o inventar).

[VALIDA\xC7\xC3O]
- Retorne **apenas** o JSON final (sem coment\xE1rios e sem markdown block quotes).
`,pe=$,Te=b==="autofill"?me(pe):b==="extract"?`Voc\xEA \xE9 um extrator estruturado de curr\xEDculo.

RETORNE APENAS JSON V\xC1LIDO (RFC 8259). N\xC3O use markdown. N\xC3O inclua coment\xE1rios. N\xC3O inclua texto fora do JSON.

Use EXATAMENTE esta estrutura:
{
    "structured_cv": {
        "personal_info": { "name": "", "role": "", "location": "", "linkedin": "" },
        "summary": "",
        "experience": [ { "company": "", "role": "", "period": "", "description": "" } ],
        "education": [ { "institution": "", "degree": "", "period": "" } ],
        "skills": [""]
    },
    "extracted_contacts": { "email": "", "phone": "" }
}

REGRAS:
- N\xE3o invente informa\xE7\xF5es. Se n\xE3o estiver no texto, use "" ou [].
- N\xE3o inclua texto fora do JSON.

CURR\xCDCULO:
<<<
${x?$:"(O curr\xEDculo foi enviado como imagens. Extraia as informa\xE7\xF5es visualmente.)"}
>>>`:`Voc\xEA \xE9 um especialista em an\xE1lise de curr\xEDculos com anos de experi\xEAncia em recrutamento e desenvolvimento de carreira.

    ${V?`CARGO/\xC1REA ALVO: ${V}`:""}

Analise o seguinte curr\xEDculo e retorne UM JSON (apenas JSON puro, sem markdown) com esta estrutura EXATA:

{
  "overall_score": [n\xFAmero de 0 a 100],
  "summary": "[resumo geral em portugu\xEAs de 2-3 linhas]",
  "sections": [
    {
      "name": "[nome da se\xE7\xE3o: Experi\xEAncia Profissional, Forma\xE7\xE3o Acad\xEAmica, Habilidades, etc.]",
      "score": [n\xFAmero de 0 a 100],
      "strengths": ["ponto forte 1", "ponto forte 2"],
      "weaknesses": ["ponto fraco 1", "ponto fraco 2"],
      "suggestions": ["sugest\xE3o 1", "sugest\xE3o 2", "sugest\xE3o 3"]
    }
  ]
}

REGRAS DE FORMATO E TAMANHO:
- Retorne APENAS JSON v\xE1lido (RFC 8259), sem coment\xE1rios, sem markdown, sem texto fora do JSON
- Use no m\xE1ximo 6 se\xE7\xF5es em "sections"
- Em cada se\xE7\xE3o: strengths (at\xE9 2 itens), weaknesses (at\xE9 2 itens), suggestions (at\xE9 3 itens)
- Strings curtas e objetivas (evite par\xE1grafos longos)

CURR\xCDCULO A ANALISAR:
${x?$:"(O curr\xEDculo foi enviado como imagens. Extraia as informa\xE7\xF5es visualmente.)"}

IMPORTANTE:
- Retorne APENAS o JSON, sem formata\xE7\xE3o markdown
- Seja espec\xEDfico e construtivo
- Foque em melhorias pr\xE1ticas
- Considere padr\xF5es do mercado brasileiro`,Me=s=>String(s||"").replace(/```json/gi,"```").replace(/```/g,"").replace(/[\u201C\u201D]/g,'"').replace(/[\u2018\u2019]/g,"'").trim(),K=s=>{let t=String(s||"").replace(/\r/g,"").trim(),e=t.split(`
`).map(l=>l.trim()).filter(Boolean)[0]||"",c=l=>{let D=t.match(l);return D?String(D[0]||"").trim():""},a=c(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i),g=c(/(\+?55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/),f=c(/https?:\/\/(www\.)?linkedin\.com\/[\w\-_%/?=&.#]+/i),i=(()=>{let l=t.match(/(?:^|\n)\s*Nome\s*[:\-]\s*([^\n]{2,80})/i);return l?.[1]?String(l[1]).trim():e&&e.length<80&&!/@/.test(e)?e:""})(),d=(()=>{let l=t.match(/(?:Resumo|Perfil|Sobre)\s*[:\-]?\s*([\s\S]{0,1200})/i),k=(l?.[1]?String(l[1]):"").split(/\n\s*\n/)[0]?.trim();return k&&k.length>40?k.slice(0,800):t.slice(0,600)})(),w=(()=>{let l=t.match(/(?:Habilidades|Competências)\s*[:\-]?\s*([\s\S]{0,1200})/i);return((l?.[1]?String(l[1]):"").split(/\n\s*\n/)[0]||"").split(/[\n,;•·●○◦▪■□\-–—]+/).map(U=>String(U||"").trim()).filter(Boolean).slice(0,30)})();return{structured_cv:{personal_info:{name:i,role:"",location:"",linkedin:f},summary:d,experience:[],education:[],skills:w},extracted_contacts:{email:a,phone:g},_fallback:{method:"heuristic"}}},de=s=>String(s||"").replace(/\/\*[\s\S]*?\*\//g,"").replace(/(^|\s)\/\/.*$/gm,"$1").replace(/,\s*([}\]])/g,"$1").trim(),Ce=s=>{let t=String(s||"");return t=t.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g,'$1"$2":'),t=t.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g,(r,e)=>`"${String(e).replace(/"/g,'\\"')}"`),t=t.replace(/,\s*([}\]])/g,"$1"),t},Pe=s=>{if(!s)return null;try{return JSON.parse(s)}catch{}try{return JSON.parse(de(s))}catch{}try{return JSON.parse(Ce(de(s)))}catch{return null}},ge=s=>{let t=Me(s),r=[];t&&r.push(t);let e=t.match(/\{[\s\S]*\}/);e?.[0]&&r.push(e[0]);let c=t.indexOf("{"),a=t.lastIndexOf("}");c>=0&&a>c&&r.push(t.slice(c,a+1));for(let g of r){let f=Pe(g);if(f)return f}return null},fe=s=>{if(!s)return null;let t=typeof s=="object"?s:null;if(!t)return null;let r=t?.analysis&&typeof t.analysis=="object"?t.analysis:t,e=a=>{if(typeof a=="number")return a;if(typeof a=="string"){let g=a.replace("%","").trim(),f=Number(g);if(Number.isFinite(f))return f;let i=parseFloat(g);if(Number.isFinite(i))return i}return NaN},c=(a,g)=>Array.isArray(a)?a:a&&typeof a=="object"?Object.entries(a).map(([f,i])=>{let d=i&&typeof i=="object"?i:{};return{name:d.name??f,score:Number.isFinite(e(d.score))?e(d.score):g,strengths:Array.isArray(d.strengths)?d.strengths:[],weaknesses:Array.isArray(d.weaknesses)?d.weaknesses:[],suggestions:Array.isArray(d.suggestions)?d.suggestions:[]}}):null;if(r.overall_score!=null&&r.sections!=null){let a=e(r.overall_score);if(!Number.isFinite(a))return null;let g=c(r.sections,a);return g?{overall_score:Math.max(0,Math.min(100,a)),summary:typeof r.summary=="string"?r.summary:"",sections:g}:null}if(r.score!=null){let a=e(r.score);if(!Number.isFinite(a))return null;let g=a<=10?a*10:a,f=r.suggestions_by_section,i=[];if(f&&typeof f=="object")for(let[d,w]of Object.entries(f))i.push({name:d,score:Math.max(0,Math.min(100,g)),strengths:Array.isArray(r.strengths)?r.strengths.slice(0,2):[],weaknesses:Array.isArray(r.weaknesses)?r.weaknesses.slice(0,2):[],suggestions:Array.isArray(w)?w.slice(0,3):[]});return{overall_score:Math.max(0,Math.min(100,g)),summary:typeof r.summary=="string"?r.summary:"",sections:i}}return null},ye=s=>{if(!s||typeof s!="object")return null;let t=s,r=t?.analysis&&typeof t.analysis=="object"?t.analysis:t,e=o=>typeof o=="string"?o.trim():"",c=o=>Array.isArray(o)?o:[],g=(o=>o?.data&&typeof o.data=="object"&&o.data.pessoais?o.data:o?.pessoais&&typeof o.pessoais=="object"?o:null)(s);if(g){let o=g,n=o.pessoais||{},y=(u,E=" ")=>u.map(e).filter(Boolean).join(E),h=e(n.telefone),_=h.length<8?"":h;return{ok:!0,applyMode:"replace",patch:{personal:{fullName:y([n.nome,n.sobrenome]),role:"",email:e(n.email),phone:_,location:y([n.cidade,n.estado]," - "),linkedin:e(n.links?.linkedin),github:e(n.links?.github),website:e(n.links?.site||n.links?.portfolio)},summaryHtml:o.resumo?`<p>${e(o.resumo)}</p>`:"",skills:c(o.competencias).map(e).filter(Boolean),experience:c(o.experiencia).map(u=>({title:e(u.cargo),subtitle:e(u.empresa),date:y([u.inicio,String(u.fim).toLowerCase().includes("atual")?"Atual":u.fim]," - "),descriptionHtml:Array.isArray(u.descricao)?`<ul>${u.descricao.map(E=>`<li>${e(E)}</li>`).join("")}</ul>`:""})),education:c(o.formacao).map(u=>({title:e(u.curso),subtitle:e(u.instituicao),date:y([u.inicio,String(u.fim).toLowerCase().includes("atual")?"Atual":u.fim]," - "),descriptionHtml:`<p>${y([u.nivel,u.situacao,u.observacao]," - ")}</p>`})),courses:c(o.cursos).map(u=>({title:e(u.titulo),subtitle:e(u.instituicao),date:e(u.ano),descriptionHtml:""})),projects:c(o.projetos).map(u=>({title:e(u.titulo),subtitle:"",descriptionHtml:`<p>${e(u.descricao)}</p>${u.link?`<p><a href="${u.link}">${u.link}</a></p>`:""}`}))},confidence:{personal:100,summary:100,experience:100,education:100,skills:100,courses:100,projects:100},warnings:[]}}let f=o=>String(o||"").replace(/<\s*br\s*\/?>/gi,`
`).replace(/<\s*\/\s*p\s*>/gi,`
`).replace(/<\s*p\s*>/gi,"").replace(/<\s*li\s*>/gi,"- ").replace(/<\s*\/\s*li\s*>/gi,`
`).replace(/<\s*\/\s*ul\s*>/gi,`
`).replace(/<[^>]+>/g,"").replace(/\n{3,}/g,`

`).trim(),i=o=>{let n=e(o);if(!n)return"";let y=n.replace(/\D/g,"");return y.length>=8&&y.length<=13?y:""},d=o=>{let n=[],y=new Set;for(let h of o){let _=e(h);if(!_||_.length>40||/[0-9]/.test(_)||/[\/:]/.test(_))continue;let u=_.split(/\s+/).filter(Boolean);if(u.length<1||u.length>3)continue;let E=_.replace(/[.,;:!?]$/g,"").trim(),L=E.toLowerCase();if(!(!E||y.has(L))&&(y.add(L),n.push(E),n.length>=30))break}return n},w=o=>{let n=o&&typeof o=="object"?o:{};return{fullName:e(n.fullName),role:e(n.role),email:e(n.email),phone:i(e(n.phone)),location:e(n.location),linkedin:e(n.linkedin),github:e(n.github),website:e(n.website)}},l=o=>{let n=Number(o);return Number.isFinite(n)?Math.max(0,Math.min(100,n)):0},D=(o,n,y)=>{let h=o&&typeof o=="object"?o:{},_=l(h.personal),u=Math.max(l(h.summary),l(h.skills),l(h.experience),l(h.education),l(h.courses),l(h.projects)),E=!!e(n?.summaryHtml)||Array.isArray(n?.skills)&&n.skills.length>0||Array.isArray(n?.experience)&&n.experience.length>0||Array.isArray(n?.education)&&n.education.length>0||Array.isArray(n?.courses)&&n.courses.length>0||Array.isArray(n?.projects)&&n.projects.length>0;return y.some(q=>/falha ao estruturar com confiança/i.test(String(q||"")))||_<35||!E&&u<30?!1:_>=50&&(u>=30||E)},k=r?.patch&&typeof r.patch=="object"?r.patch:r;if(k?.personal&&typeof k.personal=="object"){let o=k.personal,n=m=>{let A=String(m||"");return A=A.replace(/<\s*(script|style|iframe)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,""),A=A.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi,""),A=A.replace(/\son[a-z]+\s*=\s*'[^']*'/gi,""),A=A.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi,""),A=A.replace(/<\s*([^\s/>]+)([^>]*)>/g,(Ke,se,R)=>{let M=String(se||"").toLowerCase();if(M==="br")return"<br>";if(M==="p"||M==="ul"||M==="li"||M==="strong"||M==="em")return`<${M}>`;if(M==="a"){let G=String(R||"").match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i),Xe=G&&(G[2]||G[3]||G[4])||"",j=String(Xe||"").trim();return j&&!/^https?:\/\//i.test(j)&&!/^mailto:/i.test(j)&&(j=`https://${j}`),/^javascript:/i.test(j)&&(j=""),`<a${j?` href="${j.replace(/"/g,"")}"`:""} target="_blank" rel="noopener noreferrer">`}return""}),A=A.replace(/<\s*\/\s*([^\s>]+)\s*>/g,(Ke,se)=>{let R=String(se||"").toLowerCase();return R==="p"||R==="ul"||R==="li"||R==="strong"||R==="em"||R==="a"?`</${R}>`:""}),A.trim()},y=m=>{let A=e(m);return A?/^https?:\/\//i.test(A)?A:`https://${A}`:""},h=c(r?.warnings).map(m=>e(m)).filter(Boolean).slice(0,30),_=e(k?.summaryHtml),E=f(_).replace(/\s+/g," ").trim(),L=/@|https?:\/\/|linkedin|github|telefone|e-?mail|cidade/i.test(E);L&&h.push("Resumo continha contatos/links; removido.");let q=L?"":E.slice(0,600),He=q?`<p>${q}</p>`:"<p></p>",$e=e(o?.email),Be=i(e(o?.phone)),ze=e(o?.role)||(x&&/desenvolvedor/i.test(String(S||""))?"Desenvolvedor":""),I=r?.confidence&&typeof r?.confidence=="object"?r.confidence:{},Je=c(k?.experience).map(m=>({title:e(m?.title),subtitle:e(m?.subtitle),date:e(m?.date),descriptionHtml:n(e(m?.descriptionHtml)||"<ul><li></li></ul>")})).filter(m=>m.title),Fe=c(k?.education).map(m=>({title:e(m?.title),subtitle:e(m?.subtitle),date:e(m?.date),descriptionHtml:n(e(m?.descriptionHtml)||"<p></p>")})).filter(m=>m.title),qe=c(k?.courses).map(m=>({title:e(m?.title),provider:e(m?.provider),date:e(m?.date)})).filter(m=>m.title),Ge=c(k?.projects).map(m=>({title:e(m?.title),url:y(m?.url),date:e(m?.date),descriptionHtml:n(e(m?.descriptionHtml)||"<p></p>"),tech:c(m?.tech).map(A=>e(A)).filter(Boolean).slice(0,12)})).filter(m=>m.title),W=e(r?.applyMode);W&&W!=="replace"&&h.push(`applyMode inesperado: ${W}; for\xE7ado para replace.`);let ee={personal:{...w({fullName:e(o?.fullName),role:ze,email:$e,phone:Be,location:e(o?.location),linkedin:y(o?.linkedin),github:y(o?.github),website:y(o?.website)}),linkedin:y(o?.linkedin),github:y(o?.github),website:y(o?.website)},summaryHtml:He,skills:d(c(k?.skills)),experience:Je.slice(0,12),education:Fe.slice(0,12),courses:qe.slice(0,20),projects:Ge.slice(0,12)},te={personal:l(I?.personal),summary:l(I?.summary),skills:l(I?.skills),experience:l(I?.experience),education:l(I?.education),courses:l(I?.courses),projects:l(I?.projects)},Ve=typeof r?.ok=="boolean"?!!r.ok:null,Ye=D(te,ee,h);return(Ve===!1?!1:Ye)?{ok:!0,applyMode:"replace",patch:ee,confidence:te,warnings:h}:(h.some(m=>/falha ao estruturar com confiança/i.test(String(m||"")))||h.unshift("Falha ao estruturar com confian\xE7a"),{ok:!1,applyMode:"replace",patch:{personal:w(ee.personal),summaryHtml:"<p></p>",skills:[],experience:[],education:[],courses:[],projects:[]},confidence:{personal:l(te.personal),summary:0,skills:0,experience:0,education:0,courses:0,projects:0},warnings:h})}let N=r?.structured_cv&&typeof r.structured_cv=="object"?r.structured_cv:null;if(!N||typeof N!="object")return null;let U=N.personal_info&&typeof N.personal_info=="object"?N.personal_info:{},Ie=c(N.experience).slice(0,10).map(o=>({company:e(o?.company),role:e(o?.role),period:e(o?.period),description:e(o?.description)})),De=c(N.education).slice(0,10).map(o=>({institution:e(o?.institution),degree:e(o?.degree),period:e(o?.period)})),Ue=c(N.skills).map(o=>e(o)).filter(Boolean).slice(0,30),Se=r?.extracted_contacts&&typeof r.extracted_contacts=="object"?r.extracted_contacts:{},Q=e(N?.summary),Le=Q.length>900?Q.split(/\n\s*\n/)[0].split(/\n/).filter(o=>o&&!/@/.test(o)&&!/telefone|e-?mail|linkedin/i.test(o)).slice(0,4).join(" ").trim().slice(0,900):Q,be=e(Se?.email),ke=e(Se?.phone);return{structured_cv:{personal_info:{name:e(U?.name),role:e(U?.role),location:e(U?.location),linkedin:e(U?.linkedin),email:be,phone:ke},summary:Le,experience:Ie,education:De,skills:Ue},extracted_contacts:{email:be,phone:ke}}},J=await ue(Te,{temperature:.4,maxOutputTokens:3072,images:z?P:void 0}),B=ge(J),X=s=>String(s||"").replace(/<\s*br\s*\/?>/gi,`
`).replace(/<\s*\/\s*p\s*>/gi,`
`).replace(/<\s*p\s*>/gi,"").replace(/<\s*li\s*>/gi,"- ").replace(/<\s*\/\s*li\s*>/gi,`
`).replace(/<\s*\/\s*ul\s*>/gi,`
`).replace(/<[^>]+>/g,"").replace(/\n{3,}/g,`

`).trim(),Z=s=>{let t=s?.structured_cv;if(!t||typeof t!="object")return null;let r=t?.personal_info&&typeof t.personal_info=="object"?t.personal_info:{},e=s?.extracted_contacts&&typeof s.extracted_contacts=="object"?s.extracted_contacts:{},c=String(e.email||r.email||"").trim(),a=String(e.phone||r.phone||"").replace(/\D/g,"").trim(),f=String(t.summary||"").trim().split(/\n+/).map(i=>i.trim()).filter(Boolean).filter(i=>!/@/.test(i)&&!/https?:\/\//i.test(i)&&!/(telefone|e-?mail|linkedin|github|site|website)/i.test(i)).join(" ").trim().slice(0,600);return{ok:!1,applyMode:"replace",patch:{personal:{fullName:String(r.name||"").trim(),role:String(r.role||"").trim(),email:c,phone:a,location:String(r.location||"").trim(),linkedin:String(r.linkedin||"").trim(),github:String(r.github||"").trim(),website:String(r.website||"").trim()},summaryHtml:f?`<p>${f}</p>`:"<p></p>",skills:Array.isArray(t.skills)?t.skills.map(i=>String(i||"").trim()).filter(Boolean):[],experience:Array.isArray(t.experience)?t.experience.slice(0,12).map(i=>({title:String(i?.role||"").trim(),subtitle:String(i?.company||"").trim(),date:String(i?.period||"").trim(),descriptionHtml:(()=>{let d=String(i?.description||"").trim();return d?`<ul><li>${d}</li></ul>`:"<ul><li></li></ul>"})()})).filter(i=>i.title):[],education:Array.isArray(t.education)?t.education.slice(0,12).map(i=>({title:String(i?.institution||"").trim(),subtitle:String(i?.degree||"").trim(),date:String(i?.period||"").trim(),descriptionHtml:"<p></p>"})).filter(i=>i.title):[],courses:[],projects:[]},warnings:["Resposta da IA veio no formato legado; extra\xE7\xE3o parcial."],confidence:{personal:40,summary:30,skills:30,experience:20,education:20,courses:0,projects:0}}},he=s=>{let t=s?.patch?.personal;if(!t||typeof t!="object")return null;let r=String(t.email||"").trim(),e=String(t.phone||"").replace(/\D/g,"").trim(),c=X(String(s?.patch?.summaryHtml||"")).slice(0,900);return{structured_cv:{personal_info:{name:String(t.fullName||"").trim(),role:String(t.role||"").trim(),location:String(t.location||"").trim(),linkedin:String(t.linkedin||"").trim(),github:String(t.github||"").trim(),website:String(t.website||"").trim(),email:r,phone:e},summary:c,experience:Array.isArray(s?.patch?.experience)?s.patch.experience.slice(0,10).map(a=>({company:String(a?.subtitle||"").trim(),role:String(a?.title||"").trim(),period:String(a?.date||"").trim(),description:X(String(a?.descriptionHtml||""))})):[],education:Array.isArray(s?.patch?.education)?s.patch.education.slice(0,10).map(a=>({institution:String(a?.title||"").trim(),degree:String(a?.subtitle||"").trim(),period:String(a?.date||"").trim()})):[],skills:Array.isArray(s?.patch?.skills)?s.patch.skills:[]},extracted_contacts:{email:r,phone:e}}},Ae=s=>{let t=K(s);return Z(t)??{ok:!1,applyMode:"replace",patch:{personal:{fullName:"",role:"",email:"",phone:"",location:"",linkedin:"",github:"",website:""},summaryHtml:"<p></p>",skills:[],experience:[],education:[],courses:[],projects:[]},warnings:["Fallback heur\xEDstico vazio."],confidence:{personal:0,summary:0,skills:0,experience:0,education:0,courses:0,projects:0}}},p=b==="analysis"?fe(B):ye(B);if(b==="autofill"&&p&&p.structured_cv&&(p=Z(p)),b==="extract"&&p&&p.patch&&(p=he(p)),b==="extract"&&p&&x&&p.structured_cv){let s=K(String(S||"")),t=p,r=s,e=t?.structured_cv?.personal_info??{},c=r?.structured_cv?.personal_info??{},a=t?.extracted_contacts??{},g=r?.extracted_contacts??{},f=String(a.email||e.email||g.email||c.email||"").trim(),i=String(a.phone||e.phone||g.phone||c.phone||"").trim();p={structured_cv:{...t.structured_cv,personal_info:{...e,name:String(e.name||c.name||"").trim(),linkedin:String(e.linkedin||c.linkedin||"").trim(),email:f,phone:i},summary:(()=>{let d=String(t.structured_cv?.summary||"").trim();return!d||d.length<40?String(r.structured_cv?.summary||"").trim():d.length>1200||/experi(ê|e)ncia|forma(ç|c)ão|habilidades|compet(ê|e)ncias/i.test(d)?String(r.structured_cv?.summary||"").trim().slice(0,900):d.slice(0,900)})(),skills:Array.isArray(t.structured_cv?.skills)&&t.structured_cv.skills.length>0?t.structured_cv.skills:r.structured_cv?.skills??[]},extracted_contacts:{email:f,phone:i},_fallback:t?._fallback}}if(b==="autofill"&&p&&x&&p.patch){let s=p;if(s.ok!==!1)return s;let t=Ae(String(S||""));p={...s,ok:!1,applyMode:"replace",patch:{...s.patch,personal:{...s.patch.personal,fullName:s.patch.personal.fullName||t.patch.personal.fullName,role:s.patch.personal.role||t.patch.personal.role,email:s.patch.personal.email||t.patch.personal.email,phone:s.patch.personal.phone||t.patch.personal.phone,location:s.patch.personal.location||t.patch.personal.location,linkedin:s.patch.personal.linkedin||t.patch.personal.linkedin,github:s.patch.personal.github||t.patch.personal.github,website:s.patch.personal.website||t.patch.personal.website},summaryHtml:String(s.patch.summaryHtml||"").trim()&&X(String(s.patch.summaryHtml||"")).length>=20?s.patch.summaryHtml:t.patch.summaryHtml,skills:Array.isArray(s.patch.skills)&&s.patch.skills.length>0?s.patch.skills:t.patch.skills}}}if(!p){console.warn("First pass parsing/shape failed; retrying once with stricter constraints.");let s=b==="autofill"?me(pe):b==="extract"?`Retorne APENAS UM JSON v\xE1lido (RFC 8259), SEM markdown e SEM texto fora do JSON.

Use EXATAMENTE esta estrutura:
{
    "structured_cv": {
        "personal_info": { "name": "", "role": "", "location": "", "linkedin": "" },
        "summary": "",
        "experience": [ { "company": "", "role": "", "period": "", "description": "" } ],
        "education": [ { "institution": "", "degree": "", "period": "" } ],
        "skills": [""]
    },
    "extracted_contacts": { "email": "", "phone": "" }
}

REGRAS:
- N\xE3o calcule pontua\xE7\xE3o e n\xE3o avalie
- Preencha apenas com o que estiver no curr\xEDculo

CURR\xCDCULO:
${x?$:""}`:`Retorne APENAS UM JSON v\xE1lido (RFC 8259), SEM markdown e SEM texto fora do JSON.

Use EXATAMENTE esta estrutura:
{
  "overall_score": 0,
  "summary": "",
  "sections": [
    {
      "name": "",
      "score": 0,
      "strengths": [""],
      "weaknesses": [""],
      "suggestions": ["", "", ""]
    }
  ]
}

REGRAS:
- overall_score e score: n\xFAmeros de 0 a 100
- no m\xE1ximo 6 se\xE7\xF5es
- strengths/weaknesses: at\xE9 2 itens cada
- suggestions: exatamente 3 itens

CURR\xCDCULO:
${x?$:""}`;J=await ue(s,{temperature:.2,maxOutputTokens:3072,images:z?P:void 0}),B=ge(J),p=b==="analysis"?fe(B):ye(B),b==="autofill"&&p&&p.structured_cv&&(p=Z(p)),b==="extract"&&p&&p.personal&&(p=he(p))}if(!p){if(console.error("Failed to parse/normalize analysis JSON (first 1200 chars):",String(J).slice(0,1200)),x){if(b==="autofill"){let e=Ae(String(S||""));return v(200,e)}let t=K(String(S||"")),r=b==="extract"?t:{overall_score:0,summary:"A IA retornou uma resposta em formato inesperado. Preenchimento parcial aplicado.",sections:[],structured_cv:t.structured_cv,extracted_contacts:t.extracted_contacts,_fallback:{reason:"ai_json_invalid",mode:"analysis"}};return v(200,{analysis:r,warning:"IA retornou JSON inv\xE1lido; usando extra\xE7\xE3o heur\xEDstica.",request_id:O})}return v(502,{error:"Erro ao processar resposta da IA",error_code:"AI_JSON_INVALID",request_id:O,hint:"Tente novamente. Se persistir, reduza o tamanho do curr\xEDculo (1-2 p\xE1ginas) ou remova conte\xFAdo n\xE3o essencial."})}let F=p;if(b==="analysis")if(ve)try{let s=_e(re,ve),{error:t}=await s.from("resume_analyses").insert({user_id:Re,filename:oe,file_type:"pdf",analysis_result:F,score:F.overall_score/10,status:"completed"});t&&console.error("Database error:",t)}catch(s){console.error("Database save error:",s)}else console.warn("SUPABASE_SERVICE_ROLE_KEY not configured; skipping DB save.");return b==="autofill"?v(200,F):v(200,{analysis:F,request_id:O})}catch(T){console.error("Error:",T);let S=T instanceof Error?T.message:String(T),P=S.includes("processar resposta")||S.includes("Resposta vazia")||S.includes("comunicar com a IA")||S.includes("Resposta inv\xE1lida")||S.includes("IA bloqueou a resposta");return v(P?502:400,{error:S,error_code:P?"AI_UPSTREAM_ERROR":"BAD_REQUEST",request_id:O})}});
