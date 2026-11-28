import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useFila } from '@/hooks/useFila';
import SwipeQueueItem from '@/components/SwipeQueueItem';
import { clientesDo, concluirCliente, definirFilaAberta, ErroSessaoExpirada, filaAberta } from '@/lib/queue';
import { limparSessao, lerSessao, type SessaoBarbeiro } from '@/lib/sessaoBarbeiro';

export default function BarberPanelPage() {
  const navigate = useNavigate();
  const [sessao] = useState<SessaoBarbeiro | null>(lerSessao);
  const { barbeiros, clientes, status, atualizar, removerLocalmente } = useFila();
  const [erro, setErro] = useState<string | null>(null);
  const [alterando, setAlterando] = useState(false);

  if (sessao === null) return <Navigate to="/admin" replace />;

  const barbeiro = barbeiros.find((b) => b.id === sessao.barbeiroId);
  const fila = clientesDo(clientes, sessao.barbeiroId);
  const aberta = barbeiro ? filaAberta(barbeiro) : false;

  const sair = () => {
    limparSessao();
    navigate('/admin', { replace: true });
  };

  const tratarErro = (e: unknown, mensagemPadrao: string) => {
    if (e instanceof ErroSessaoExpirada) {
      sair();
      return;
    }
    setErro(e instanceof Error ? e.message : mensagemPadrao);
  };

  const concluir = async (id: string) => {
    setErro(null);
    removerLocalmente(id);
    try {
      await concluirCliente(id, sessao.token);
    } catch (e) {
      tratarErro(e, 'Não foi possível concluir este cliente. Tente novamente.');
    }
    await atualizar();
  };

  const alternarFila = async () => {
    setErro(null);
    setAlterando(true);
    try {
      await definirFilaAberta(sessao.token, !aberta);
      await atualizar();
    } catch (e) {
      tratarErro(e, 'Não foi possível alterar a fila. Tente novamente.');
    } finally {
      setAlterando(false);
    }
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

      <section
        className={`flex flex-col gap-4 rounded-2xl border px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${
          aberta ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-ink-line bg-ink-soft'
        }`}
      >
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${aberta ? 'bg-emerald-400' : 'bg-white/30'}`}
            />
            {aberta ? 'Sua fila está aberta' : 'Sua fila está fechada'}
          </p>
          <p className="mt-1 text-sm text-white/50">
            {aberta
              ? 'Os clientes já podem entrar na sua fila. Fechar não remove quem já está esperando.'
              : 'Os clientes não conseguem entrar na sua fila. Ela fecha sozinha à meia-noite.'}
          </p>
        </div>
        <button
          type="button"
          onClick={alternarFila}
          disabled={alterando || !barbeiro}
          className={aberta ? 'btn-outline shrink-0' : 'btn-gold shrink-0'}
        >
          {alterando ? 'Salvando...' : aberta ? 'Fechar fila' : 'Abrir fila'}
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
