import React from "react";
import { ResumeData, emptyResume } from "../types/affinda";
import { supabaseService } from "../services/supabaseService";

export default function ResumeImport() {
    const [data, setData] = React.useState<ResumeData>(emptyResume);
    const [status, setStatus] = React.useState<string>("");
    const [loading, setLoading] = React.useState<boolean>(false);
    const fileRef = React.useRef<HTMLInputElement>(null);

    async function handleImport() {
        const file = fileRef.current?.files?.[0];
        if (!file) { setStatus("Selecione um arquivo PDF/DOCX."); return; }
        if (!/\.(pdf|docx)$/i.test(file.name)) { setStatus("Tipo inválido. Use PDF ou DOCX."); return; }
        if (file.size > 5 * 1024 * 1024) { setStatus("Arquivo muito grande (limite 5MB)."); return; }

        const fd = new FormData();
        fd.append("resume", file);
        setLoading(true); setStatus("Processando currículo...");

        try {
            const supabase = supabaseService.getClient();
            if (!supabase) throw new Error("Supabase não inicializado.");

            // Call Edge Function
            const { data: json, error } = await supabase.functions.invoke('parse-resume', {
                body: fd,
            });

            if (error) {
                // If the error is a string (sometimes happens with edge functions), use it
                const msg = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
                throw new Error(msg);
            }

            if (!json) throw new Error("Resposta vazia do servidor.");

            // Não sobrescreva campos já editados se desejar; aqui sobrescrevemos todos
            setData(json as ResumeData);
            setStatus("Currículo importado. Revise os campos.");
        } catch (e: any) {
            console.error(e);
            setStatus(`Erro: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }

    function update<K extends keyof ResumeData>(key: K, value: ResumeData[K]) {
        setData(prev => ({ ...prev, [key]: value }));
    }

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
                <h2 className="text-xl font-bold mb-4">Importar Currículo</h2>
                <div className="flex gap-2 items-center mb-4">
                    <input ref={fileRef} type="file" accept=".pdf,.docx" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                    <button onClick={handleImport} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                        {loading ? "Processando..." : "Importar"}
                    </button>
                </div>
                <div style={{ marginTop: 8, color: loading ? "#555" : "#0a7a0a" }}>{status}</div>

                <h3 className="text-lg font-semibold mt-6 mb-2">Formulário</h3>
                <div className="space-y-4">
                    <label className="block">
                        <span className="text-gray-700">Nome</span>
                        <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2" value={data.nome} onChange={e => update("nome", e.target.value)} />
                    </label>
                    <label className="block">
                        <span className="text-gray-700">E-mail</span>
                        <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2" value={data.email} onChange={e => update("email", e.target.value)} />
                    </label>
                    <label className="block">
                        <span className="text-gray-700">Telefone</span>
                        <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2" value={data.telefone} onChange={e => update("telefone", e.target.value)} />
                    </label>
                    <label className="block">
                        <span className="text-gray-700">LinkedIn</span>
                        <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2" value={data.linkedin} onChange={e => update("linkedin", e.target.value)} />
                    </label>
                    <label className="block">
                        <span className="text-gray-700">Resumo</span>
                        <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2" value={data.resumo} onChange={e => update("resumo", e.target.value)} rows={4} />
                    </label>
                    <label className="block">
                        <span className="text-gray-700">Habilidades (separe por vírgulas)</span>
                        <input
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2"
                            value={data.habilidades.join(", ")}
                            onChange={e => update("habilidades", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                        />
                    </label>
                </div>

                <h4 className="text-md font-semibold mt-6 mb-2">Experiências</h4>
                {data.experiencias.map((exp, idx) => (
                    <div key={idx} className="border-t border-gray-200 pt-4 mb-4 space-y-2">
                        <label className="block">
                            <span className="text-sm text-gray-600">Empresa</span>
                            <input
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2"
                                value={exp.empresa}
                                onChange={e => {
                                    const experiencias = [...data.experiencias];
                                    experiencias[idx] = { ...exp, empresa: e.target.value };
                                    update("experiencias", experiencias);
                                }}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm text-gray-600">Cargo</span>
                            <input
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2"
                                value={exp.cargo}
                                onChange={e => {
                                    const experiencias = [...data.experiencias];
                                    experiencias[idx] = { ...exp, cargo: e.target.value };
                                    update("experiencias", experiencias);
                                }}
                            />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                                <span className="text-sm text-gray-600">Início</span>
                                <input
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2"
                                    value={exp.inicio}
                                    onChange={e => {
                                        const experiencias = [...data.experiencias];
                                        experiencias[idx] = { ...exp, inicio: e.target.value };
                                        update("experiencias", experiencias);
                                    }}
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm text-gray-600">Fim</span>
                                <input
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2"
                                    value={exp.fim}
                                    onChange={e => {
                                        const experiencias = [...data.experiencias];
                                        experiencias[idx] = { ...exp, fim: e.target.value };
                                        update("experiencias", experiencias);
                                    }}
                                />
                            </label>
                        </div>
                        <label className="block">
                            <span className="text-sm text-gray-600">Descrição</span>
                            <textarea
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2"
                                rows={3}
                                value={exp.descricao}
                                onChange={e => {
                                    const experiencias = [...data.experiencias];
                                    experiencias[idx] = { ...exp, descricao: e.target.value };
                                    update("experiencias", experiencias);
                                }}
                            />
                        </label>
                    </div>
                ))}

                <button
                    onClick={() => update("experiencias", [...data.experiencias, { empresa: "", cargo: "", inicio: "", fim: "", descricao: "" }])}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                    + Adicionar experiência
                </button>

                <h4 className="text-md font-semibold mt-6 mb-2">Formação</h4>
                {data.formacao.map((edu, idx) => (
                    <div key={idx} className="border-t border-gray-200 pt-4 mb-4 space-y-2">
                        <label className="block">
                            <span className="text-sm text-gray-600">Instituição</span>
                            <input
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2"
                                value={edu.instituicao}
                                onChange={e => {
                                    const formacao = [...data.formacao];
                                    formacao[idx] = { ...edu, instituicao: e.target.value };
                                    update("formacao", formacao);
                                }}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm text-gray-600">Curso</span>
                            <input
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2"
                                value={edu.curso}
                                onChange={e => {
                                    const formacao = [...data.formacao];
                                    formacao[idx] = { ...edu, curso: e.target.value };
                                    update("formacao", formacao);
                                }}
                            />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                                <span className="text-sm text-gray-600">Início</span>
                                <input
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2"
                                    value={edu.inicio}
                                    onChange={e => {
                                        const formacao = [...data.formacao];
                                        formacao[idx] = { ...edu, inicio: e.target.value };
                                        update("formacao", formacao);
                                    }}
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm text-gray-600">Fim</span>
                                <input
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2"
                                    value={edu.fim}
                                    onChange={e => {
                                        const formacao = [...data.formacao];
                                        formacao[idx] = { ...edu, fim: e.target.value };
                                        update("formacao", formacao);
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                ))}

                <button
                    onClick={() => update("formacao", [...data.formacao, { instituicao: "", curso: "", inicio: "", fim: "" }])}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                    + Adicionar formação
                </button>
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4">Preview</h2>
                <div className="bg-white p-6 shadow-lg rounded-lg border border-gray-200 min-h-[500px]">
                    <ResumePreview data={data} />
                </div>
            </div>
        </div>
    );
}

function ResumePreview({ data }: { data: ResumeData }) {
    return (
        <div>
            <h3 className="text-2xl font-bold text-gray-900">{data.nome || "Seu Nome"}</h3>
            <div className="text-sm text-gray-600 mt-1">{[data.email, data.telefone, data.linkedin].filter(Boolean).join(" • ")}</div>

            {data.resumo && <>
                <h4 className="text-lg font-semibold mt-4 border-b border-gray-300 pb-1">Resumo</h4>
                <p className="mt-2 text-gray-700 whitespace-pre-wrap">{data.resumo}</p>
            </>}

            {data.habilidades.length > 0 && <>
                <h4 className="text-lg font-semibold mt-4 border-b border-gray-300 pb-1">Habilidades</h4>
                <ul className="mt-2 list-disc list-inside text-gray-700">
                    {data.habilidades.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
            </>}

            {data.experiencias.length > 0 && <>
                <h4 className="text-lg font-semibold mt-4 border-b border-gray-300 pb-1">Experiências</h4>
                <ul className="mt-2 space-y-3">
                    {data.experiencias.map((e, i) => (
                        <li key={i}>
                            <div className="flex justify-between items-baseline">
                                <strong className="text-gray-900">{e.cargo}</strong>
                                <span className="text-sm text-gray-500">{e.inicio} – {e.fim}</span>
                            </div>
                            <div className="text-gray-800 font-medium">{e.empresa}</div>
                            <p className="text-gray-700 mt-1 whitespace-pre-wrap">{e.descricao}</p>
                        </li>
                    ))}
                </ul>
            </>}

            {data.formacao.length > 0 && <>
                <h4 className="text-lg font-semibold mt-4 border-b border-gray-300 pb-1">Formação</h4>
                <ul className="mt-2 space-y-2">
                    {data.formacao.map((f, i) => (
                        <li key={i}>
                            <div className="flex justify-between items-baseline">
                                <strong className="text-gray-900">{f.curso}</strong>
                                <span className="text-sm text-gray-500">{f.inicio} – {f.fim}</span>
                            </div>
                            <div className="text-gray-800">{f.instituicao}</div>
                        </li>
                    ))}
                </ul>
            </>}
        </div>
    );
}
