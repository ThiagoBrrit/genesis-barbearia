import { Navigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ordinal } from '@/lib/format';

interface ConfirmacaoState {
  nome: string;
  barbeiroNome: string;
  posicao: number;
}

function lerEstado(state: unknown): ConfirmacaoState | null {
  if (!state || typeof state !== 'object') return null;
  const s = state as Partial<ConfirmacaoState>;
  if (typeof s.nome !== 'string' || typeof s.barbeiroNome !== 'string' || typeof s.posicao !== 'number') {
    return null;
  }
  return { nome: s.nome, barbeiroNome: s.barbeiroNome, posicao: s.posicao };
}

export default function ConfirmacaoPage() {
  const location = useLocation();
  const confirmacao = lerEstado(location.state);

  if (!confirmacao) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-lg space-y-10 pt-6 text-center md:pt-12">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold text-ink shadow-[0_0_60px_-10px_rgba(212,175,55,0.6)]"
      >
        <Check size={36} strokeWidth={3} />
      </motion.div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">Presença confirmada</p>
        <p className="font-display text-7xl leading-none text-white">{ordinal(confirmacao.posicao)}</p>
        <h1 className="font-display text-2xl text-white/90">
          Você é o {ordinal(confirmacao.posicao)} da fila do {confirmacao.barbeiroNome}
        </h1>
        <p className="text-base text-white/60">Cliente: {confirmacao.nome}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to="/filas" className="btn-outline">
          Ver filas ao vivo
        </Link>
        <Link to="/" className="btn-gold">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
