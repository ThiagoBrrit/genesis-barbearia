import { Link } from 'react-router-dom';
import { useFila } from '@/hooks/useFila';
import { clientesDo } from '@/lib/queue';
import { textoPessoasNaFila } from '@/lib/format';

export default function QueuePage() {
  const { barbeiros, clientes, status } = useFila();

  return (
    <div className="space-y-10 animate-fade-in">
      <section className="pt-6 text-center md:pt-10">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">Ao vivo</p>
        <h1 className="mt-4 font-display text-4xl text-white sm:text-5xl">Filas de hoje</h1>
        <p className="mx-auto mt-4 max-w-md text-base text-white/60">
          A lista se atualiza sozinha. Escolha o barbeiro com menos pessoas.
        </p>
      </section>

      {status === 'erro' && (
        <p role="alert" className="text-center text-sm text-red-400">
          Não foi possível atualizar agora. Tentando novamente...
        </p>
      )}

      <section className="grid gap-5 md:grid-cols-3">
        {barbeiros.map((barbeiro) => {
          const fila = clientesDo(clientes, barbeiro.id);
          return (
            <article key={barbeiro.id} className="rounded-2xl border border-ink-line bg-ink-soft p-6">
              <div className="flex items-baseline justify-between gap-3 border-b border-ink-line pb-4">
                <h2 className="font-display text-xl text-white">{barbeiro.nome}</h2>
                <span className="text-sm text-gold">{textoPessoasNaFila(fila.length)}</span>
              </div>
              {fila.length === 0 ? (
                <p className="py-6 text-center text-sm text-white/40">Sem ninguém na fila</p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {fila.map((cliente) => (
                    <li key={cliente.id} className="flex items-center gap-4 rounded-xl bg-ink px-4 py-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-ink">
                        {cliente.posicao}
                      </span>
                      <span className="min-w-0 truncate text-white/90">{cliente.nome_cliente}</span>
                    </li>
                  ))}
                </ol>
              )}
            </article>
          );
        })}
      </section>

      <div className="flex justify-center">
        <Link to="/marcar" className="btn-gold w-full sm:w-auto">
          Marcar Horário
        </Link>
      </div>
    </div>
  );
}
