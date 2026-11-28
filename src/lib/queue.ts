import { supabase } from '@/lib/supabase';

export interface Barbeiro {
  id: number;
  nome: string;
  // Data (AAAA-MM-DD) em que a fila foi aberta; vazio = fechada
  aberta_dia: string | null;
}

export interface ClienteFila {
  id: string;
  nome_cliente: string;
  barbeiro_id: number;
  posicao: number;
}

export interface SessaoBarbeiroResposta {
  token: string;
  barbeiroId: number;
}

export interface EntradaFila {
  id: string;
  nome_cliente: string;
  barbeiro_id: number;
  posicao: number;
}

const ERRO_GENERICO = 'Não foi possível falar com o servidor. Tente novamente.';

export class ErroSessaoExpirada extends Error {
  constructor() {
    super('Sua sessão expirou. Entre novamente.');
  }
}

// RESET DIÁRIO: a fila só mostra clientes de hoje (fuso de São Paulo), por isso não é preciso apagar nada
export function dataDeHoje(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

// A fila só vale como aberta no dia em que o barbeiro a abriu (reabre manualmente todo dia)
export function filaAberta(barbeiro: Barbeiro): boolean {
  return barbeiro.aberta_dia === dataDeHoje();
}

export async function buscarBarbeiros(): Promise<Barbeiro[]> {
  const { data, error } = await supabase.from('barbeiros').select('id, nome, aberta_dia').order('id');
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
  if (error) {
    if (error.code === '55000') {
      throw new Error('Essa fila está fechada no momento. Escolha outro barbeiro ou volte mais tarde.');
    }
    throw new Error(ERRO_GENERICO);
  }
  const entrada = data as Partial<EntradaFila> | null;
  if (!entrada || typeof entrada.posicao !== 'number') throw new Error(ERRO_GENERICO);
  return entrada as EntradaFila;
}

export async function loginBarbeiro(usuario: string, senha: string): Promise<SessaoBarbeiroResposta> {
  const { data, error } = await supabase.rpc('login_barbeiro', {
    p_usuario: usuario,
    p_senha: senha,
  });
  if (error) {
    if (error.code === '28P01') throw new Error('Usuário ou senha incorretos.');
    throw new Error(ERRO_GENERICO);
  }
  const resposta = data as { token?: unknown; barbeiro_id?: unknown } | null;
  if (!resposta || typeof resposta.token !== 'string' || typeof resposta.barbeiro_id !== 'number') {
    throw new Error(ERRO_GENERICO);
  }
  return { token: resposta.token, barbeiroId: resposta.barbeiro_id };
}

function tratarErroDeSessao(error: { code?: string }): never {
  if (error.code === '28000') throw new ErroSessaoExpirada();
  if (error.code === '42501') throw new Error('Você só pode mexer na sua própria fila.');
  throw new Error(ERRO_GENERICO);
}

export async function concluirCliente(id: string, token: string): Promise<void> {
  const { error } = await supabase.rpc('concluir_cliente', { p_id: id, p_token: token });
  if (error) tratarErroDeSessao(error);
}

export async function definirFilaAberta(token: string, aberta: boolean): Promise<void> {
  const { error } = await supabase.rpc('definir_fila_aberta', { p_token: token, p_aberta: aberta });
  if (error) tratarErroDeSessao(error);
}

export function clientesDo(clientes: ClienteFila[], barbeiroId: number): ClienteFila[] {
  return clientes
    .filter((c) => c.barbeiro_id === barbeiroId)
    .sort((a, b) => a.posicao - b.posicao);
}

export function barbeiroComMenorFila(barbeiros: Barbeiro[], clientes: ClienteFila[]): number | null {
  const abertos = barbeiros.filter(filaAberta);
  if (abertos.length < 2) return null;
  const totais = abertos.map((b) => ({ id: b.id, total: clientesDo(clientes, b.id).length }));
  const menor = Math.min(...totais.map((t) => t.total));
  const maior = Math.max(...totais.map((t) => t.total));
  if (menor === maior) return null;
  return totais.find((t) => t.total === menor)?.id ?? null;
}
