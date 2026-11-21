import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useFila } from '@/hooks/useFila';
import SwipeQueueItem from '@/components/SwipeQueueItem';
import { clientesDo, concluirCliente } from '@/lib/queue';
import { limparSessao, lerSessao } from '@/lib/sessaoBarbeiro';

export default function BarberPanelPage() {
  const navigate = useNavigate();
  const [barbeiroId] = useState<number | null>(lerSessao);
  const { barbeiros, clientes, status, atualizar, removerLocalmente } = useFila();
  const [erro, setErro] = useState<string | null>(null);

  if (barbeiroId === null) return <Navigate to="/admin" replace />;

  const barbeiro = barbeiros.find((b) => b.id === barbeiroId);
  const fila = clientesDo(clientes, barbeiroId);

  const concluir = async (id: string) => {
    setErro(null);
    removerLocalmente(id);
    try {
      await concluirCliente(id);
    } catch {
      setErro('Não foi possível concluir este cliente. Tente novamente.');
    }
    await atualizar();
  };

  const sair = () => {
    limparSessao();
    navigate('/admin', { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl space-y-8 animate-fade-in">
      <section className="flex items-start justify-between gap-4 pt-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">Painel do barbeiro</p>
          <h1 className="mt-2 font-display text-3xl text-white">{barbeiro?.nome ?? 'Carregando...'}</h1>
          <p className="mt-2 text-sm text-white/60">
            {fila.length === 1 ? '1 cliente aguardando' : `${fila.length} clientes aguardando`}
          </p>
        </div>
        <button
          type="button"
          onClick={sair}
          className="inline-flex items-center gap-2 rounded-xl border border-ink-line px-4 py-2.5 text-sm font-medium text-white/80 transition hover:border-gold hover:text-gold"
        >
          <LogOut size={16} />
          Sair
        </button>
      </section>

      {status === 'erro' && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Não foi possível atualizar a fila. Tentando novamente...
        </p>
      )}
      {erro && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}

      {fila.length > 0 && (
        <p className="text-xs text-white/40">
          Arraste o cliente para a esquerda ou toque no check para concluir o corte.
        </p>
      )}

      {status !== 'carregando' && fila.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-line p-10 text-center">
          <p className="text-white/60">Nenhum cliente na fila agora.</p>
        </div>
      )}

      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {fila.map((cliente) => (
            <motion.li
              key={cliente.id}
              layout
              exit={{ opacity: 0, height: 0, marginBottom: -12 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <SwipeQueueItem
                posicao={cliente.posicao}
                nome={cliente.nome_cliente}
                onComplete={() => concluir(cliente.id)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
