// services/ibgeService.ts
// Serviço para buscar estados e cidades do IBGE

export interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

export interface Cidade {
  id: number;
  nome: string;
}

export async function getEstados(): Promise<Estado[]> {
  const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
  if (!res.ok) throw new Error('Erro ao buscar estados');
  return res.json();
}

export async function getCidadesPorEstado(uf: string): Promise<Cidade[]> {
  const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
  if (!res.ok) throw new Error('Erro ao buscar cidades');
  return res.json();
}
