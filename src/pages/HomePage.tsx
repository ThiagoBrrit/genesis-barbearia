import { Link } from 'react-router-dom';
import { useFila } from '@/hooks/useFila';
import BarberCard from '@/components/BarberCard';
import { barbeiroComMenorFila } from '@/lib/queue';

export default function HomePage() {
  const { barbeiros, clientes, status } = useFila();
  const menorFilaId = barbeiroComMenorFila(barbeiros, clientes);

  return (
    <div className="space-y-12 animate-fade-in">
      <section className="pt-6 text-center md:pt-12">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">Sem horário marcado</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-white sm:text-5xl">
          Chegou, entrou na fila.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-white/60">
          Entre na fila pelo celular, veja quantas pessoas esperam e acompanhe sua posição em tempo real.
        </p>
      </section>

      {status === 'carregando' && (
        <p className="text-center text-sm text-white/50">Carregando filas...</p>
      )}
      {status === 'erro' && barbeiros.length === 0 && (
        <p role="alert" className="text-center text-sm text-red-400">
          Não foi possível carregar as filas agora. Tentando novamente...
        </p>
      )}

      {barbeiros.length > 0 && (
        <section className="grid gap-5 md:grid-cols-3">
          {barbeiros.map((barbeiro) => (
            <BarberCard
              key={barbeiro.id}
              barbeiro={barbeiro}
              clientes={clientes}
              menorFila={barbeiro.id === menorFilaId}
            />
          ))}
        </section>
      )}

      <div className="flex justify-center">
        <Link to="/marcar" className="btn-gold w-full sm:w-auto">
          Marcar Horário
        </Link>
      </div>
    </div>
  );
}
