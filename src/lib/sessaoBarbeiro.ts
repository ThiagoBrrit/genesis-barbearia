const CHAVE_SESSAO = 'barbearia-sessao-barbeiro';

export function salvarSessao(barbeiroId: number): void {
  sessionStorage.setItem(CHAVE_SESSAO, String(barbeiroId));
}

export function lerSessao(): number | null {
  const valor = Number(sessionStorage.getItem(CHAVE_SESSAO));
  return Number.isInteger(valor) && valor > 0 ? valor : null;
}

export function limparSessao(): void {
  sessionStorage.removeItem(CHAVE_SESSAO);
}
