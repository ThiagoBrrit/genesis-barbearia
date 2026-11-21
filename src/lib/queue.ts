import { supabase } from '@/lib/supabase';

export interface Barbeiro {
  id: number;
  nome: string;
}

export interface ClienteFila {
  id: string;
  nome_cliente: string;
  barbeiro_id: number;
  posicao: number;
}

export interface EntradaFila {
  id: string;
  nome_cliente: string;
  barbeiro_id: number;
  posicao: number;
}

const ERRO_GENERICO = 'Não foi possível falar com o servidor. Tente novamente.';

// RESET DIÁRIO: a fila só mostra clientes de hoje (fuso de São Paulo), por isso não é preciso apagar nada
export function dataDeHoje(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

export async function buscarBarbeiros(): Promise<Barbeiro[]> {
  const { data, error } = await supabase.from('barbeiros').select('id, nome').order('id');
  if (error || !Array.isArray(data)) throw new Error(ERRO_GENERICO);
  return data as Barbeiro[];
}

export async function buscarFilaDeHoje(): Promise<ClienteFila[]> {
  const { data, error } = await supabase
    .from('fila')
    .select('id, nome_cliente, barbeiro_id, posicao')
    .eq('dia', dataDeHoje())
    .eq('status', 'aguardando')
    .order('posicao');
  if (error || !Array.isArray(data)) throw new Error(ERRO_GENERICO);
  return data as ClienteFila[];
}

export async function entrarNaFila(nome: string, barbeiroId: number): Promise<EntradaFila> {
  const { data, error } = await supabase.rpc('entrar_na_fila', {
    p_nome: nome,
    p_barbeiro_id: barbeiroId,
  });
  if (error) throw new Error(ERRO_GENERICO);
  const entrada = data as Partial<EntradaFila> | null;
  if (!entrada || typeof entrada.posicao !== 'number') throw new Error(ERRO_GENERICO);
  return entrada as EntradaFila;
}

export async function concluirCliente(id: string): Promise<void> {
  const { error } = await supabase.rpc('concluir_cliente', { p_id: id });
  if (error) throw new Error(ERRO_GENERICO);
}

export function clientesDo(clientes: ClienteFila[], barbeiroId: number): ClienteFila[] {
  return clientes
    .filter((c) => c.barbeiro_id === barbeiroId)
    .sort((a, b) => a.posicao - b.posicao);
}

export function barbeiroComMenorFila(barbeiros: Barbeiro[], clientes: ClienteFila[]): number | null {
  if (barbeiros.length < 2) return null;
  const totais = barbeiros.map((b) => ({ id: b.id, total: clientesDo(clientes, b.id).length }));
  const menor = Math.min(...totais.map((t) => t.total));
  const maior = Math.max(...totais.map((t) => t.total));
  if (menor === maior) return null;
  return totais.find((t) => t.total === menor)?.id ?? null;
}
