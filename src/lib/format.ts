export function ordinal(posicao: number): string {
  return `${posicao}º`;
}

export function textoPessoasNaFila(total: number): string {
  return total === 1 ? '1 pessoa na fila' : `${total} pessoas na fila`;
}
