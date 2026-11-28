const CHAVE_SESSAO = 'barbearia-sessao-barbeiro-v2';

export interface SessaoBarbeiro {
  token: string;
  barbeiroId: number;
}

export function salvarSessao(sessao: SessaoBarbeiro): void {
  sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export function lerSessao(): SessaoBarbeiro | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE_SESSAO);
    if (!bruto) return null;
    const dados = JSON.parse(bruto) as Partial<SessaoBarbeiro>;
    if (typeof dados.token !== 'string' || !Number.isInteger(dados.barbeiroId)) return null;
    return { token: dados.token, barbeiroId: dados.barbeiroId as number };
  } catch {
    return null;
  }
}

export function limparSessao(): void {
  sessionStorage.removeItem(CHAVE_SESSAO);
}
