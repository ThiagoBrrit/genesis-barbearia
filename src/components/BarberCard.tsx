import { Link } from 'react-router-dom';
import { type Barbeiro, type ClienteFila, clientesDo } from '@/lib/queue';
import { ordinal } from '@/lib/format';

interface BarberCardProps {
  barbeiro: Barbeiro;
  clientes: ClienteFila[];
  menorFila: boolean;
}

const MAX_NOMES_VISIVEIS = 3;

export default function BarberCard({ barbeiro, clientes, menorFila }: BarberCardProps) {
  const fila = clientesDo(clientes, barbeiro.id);
  const visiveis = fila.slice(0, MAX_NOMES_VISIVEIS);
  const restantes = fila.length - visiveis.length;

  return (
    <article className="flex flex-col rounded-2xl border border-ink-line bg-ink-soft p-6 transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_20px_40px_-20px_rgba(212,175,55,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-2xl text-white">{barbeiro.nome}</h2>
        {menorFila && (
          <span className="shrink-0 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-ink">
            Menor fila
          </span>
        )}
      </div>

      <div className="mt-6 flex items-end gap-3">
        <span className="font-display text-5xl leading-none text-gold">{fila.length}</span>
        <span className="pb-1 text-sm text-white/60">
          {fila.length === 1 ? 'pessoa na fila' : 'pessoas na fila'}
        </span>
      </div>

      <ul className="mt-6 flex-1 space-y-2 border-t border-ink-line pt-5">
        {fila.length === 0 && <li className="text-sm text-white/40">Fila vazia no momento</li>}
        {visiveis.map((cliente) => (
          <li key={cliente.id} className="flex items-center gap-3 text-sm">
            <span className="w-8 shrink-0 font-semibold text-gold/80">{ordinal(cliente.posicao)}</span>
            <span className="truncate text-white/80">{cliente.nome_cliente}</span>
          </li>
        ))}
        {restantes > 0 && <li className="text-sm text-white/40">+{restantes} na fila</li>}
      </ul>

      <Link
        to="/filas"
        className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-gold transition hover:gap-2 hover:text-gold-light"
      >
        Ver fila completa <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
