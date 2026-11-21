import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Check } from 'lucide-react';

const LIMITE_DE_ARRASTE = 0.4;
const VELOCIDADE_DE_DESCARTE = -500;

interface SwipeQueueItemProps {
  posicao: number;
  nome: string;
  onComplete: () => void;
}

export default function SwipeQueueItem({ posicao, nome, onComplete }: SwipeQueueItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);
  const [concluindo, setConcluindo] = useState(false);
  const x = useMotionValue(0);
  const revelarOpacidade = useTransform(x, [-120, -24, 0], [1, 0.6, 0]);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    const medir = () => setLargura(elemento.offsetWidth);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const concluir = () => {
    if (concluindo) return;
    setConcluindo(true);
    animate(x, -largura, { duration: 0.2, ease: 'easeOut', onComplete });
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const passouDoLimite = largura > 0 && -info.offset.x >= largura * LIMITE_DE_ARRASTE;
    const arrastouRapido = info.velocity.x <= VELOCIDADE_DE_DESCARTE;
    if (passouDoLimite || arrastouRapido) {
      concluir();
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 });
    }
  };

  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl">
      <motion.div
        aria-hidden="true"
        style={{ opacity: revelarOpacidade }}
        className="absolute inset-0 flex items-center justify-end gap-2 rounded-2xl bg-gold pr-6 text-ink"
      >
        <span className="text-sm font-semibold uppercase tracking-wider">Concluir</span>
        <Check size={22} strokeWidth={3} />
      </motion.div>

      <motion.div
        drag={concluindo ? false : 'x'}
        dragConstraints={{ left: -largura, right: 0 }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x, touchAction: 'pan-y' }}
        className="relative flex cursor-grab items-center gap-4 rounded-2xl border border-ink-line bg-ink-soft p-4 active:cursor-grabbing"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-ink">
          {posicao}º
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white">{nome}</p>
          <p className="text-xs text-white/40">Aguardando o corte</p>
        </div>
        <button
          type="button"
          onClick={concluir}
          aria-label={`Concluir corte de ${nome}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold transition duration-200 hover:bg-gold hover:text-ink active:scale-95"
        >
          <Check size={20} strokeWidth={2.5} />
        </button>
      </motion.div>
    </div>
  );
}
