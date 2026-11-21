import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useFila } from '@/hooks/useFila';
import { barbeiroComMenorFila, clientesDo, entrarNaFila } from '@/lib/queue';
import { textoPessoasNaFila } from '@/lib/format';
import { HAIRCUT_PRICE } from '@/config';

const NOME_MIN = 2;
const NOME_MAX = 60;

export default function BookingPage() {
  const navigate = useNavigate();
  const { barbeiros, clientes, status } = useFila();
  const [nome, setNome] = useState('');
  const [barbeiroId, setBarbeiroId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const menorFilaId = barbeiroComMenorFila(barbeiros, clientes);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    const barbeiro = barbeiros.find((b) => b.id === barbeiroId);

    if (nomeLimpo.length < NOME_MIN) {
      setErro(`Digite seu nome (mínimo de ${NOME_MIN} letras).`);
      return;
    }
    if (nomeLimpo.length > NOME_MAX) {
      setErro(`Use no máximo ${NOME_MAX} caracteres.`);
      return;
    }
    if (!barbeiro) {
      setErro('Escolha um barbeiro para entrar na fila.');
      return;
    }

    setErro(null);
    setEnviando(true);
    try {
      const entrada = await entrarNaFila(nomeLimpo, barbeiro.id);
      navigate('/marcar/confirmado', {
        state: {
          nome: entrada.nome_cliente,
          barbeiroNome: barbeiro.nome,
          posicao: entrada.posicao,
        },
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
      setEnviando(false);
    }
  };

  const semBarbeiros = status !== 'carregando' && barbeiros.length === 0;

  return (
    <div className="mx-auto max-w-lg space-y-10 animate-fade-in">
      <section className="pt-6 text-center md:pt-10">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">Entrar na fila</p>
        <h1 className="mt-4 font-display text-4xl text-white">Marcar Horário</h1>
        <p className="mx-auto mt-4 max-w-sm text-base text-white/60">
          Sem horário fixo: quem chega primeiro, corta primeiro.
        </p>
      </section>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-gold/30 bg-gold/10 px-5 py-4 shadow-[0_12px_30px_-20px_rgba(212,175,55,0.6)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Valor do corte</p>
          <p className="mt-1 text-sm text-white/60">Pagamento no local</p>
        </div>
        <p className="font-display text-2xl text-gold">{HAIRCUT_PRICE}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <div className="space-y-3">
          <label htmlFor="nome" className="text-sm font-medium text-white/80">
            Seu nome
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={NOME_MAX}
            autoComplete="name"
            placeholder="Como devemos te chamar?"
            className="w-full rounded-xl border border-ink-line bg-ink-soft px-4 py-4 text-base text-white placeholder-white/30 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="mb-3 text-sm font-medium text-white/80">Escolha o barbeiro</legend>
          {status === 'carregando' && <p className="text-sm text-white/50">Carregando barbeiros...</p>}
          {semBarbeiros && (
            <p role="alert" className="text-sm text-red-400">
              Não foi possível carregar os barbeiros. Tente novamente em instantes.
            </p>
          )}
          {barbeiros.map((barbeiro) => {
            const selecionado = barbeiroId === barbeiro.id;
            const total = clientesDo(clientes, barbeiro.id).length;
            return (
              <button
                key={barbeiro.id}
                type="button"
                aria-pressed={selecionado}
                onClick={() => setBarbeiroId(barbeiro.id)}
                className={`flex w-full items-center justify-between gap-4 rounded-xl border px-5 py-4 text-left transition duration-200 active:scale-[0.99] ${
                  selecionado
                    ? 'border-gold bg-gold/10 shadow-[0_0_0_1px_rgba(212,175,55,0.4)]'
                    : 'border-ink-line bg-ink-soft hover:border-white/30'
                }`}
              >
                <div>
                  <p className="font-medium text-white">{barbeiro.nome}</p>
                  <p className="mt-1 text-sm text-white/50">{textoPessoasNaFila(total)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {barbeiro.id === menorFilaId && !selecionado && (
                    <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
                      Menor fila
                    </span>
                  )}
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      selecionado ? 'border-gold bg-gold text-ink' : 'border-white/30 text-transparent'
                    }`}
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                </div>
              </button>
            );
          })}
        </fieldset>

        {erro && (
          <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando || barbeiros.length === 0}
          className="btn-gold w-full"
        >
          {enviando ? 'Confirmando...' : 'Confirmar presença na fila'}
        </button>

        <p className="text-center text-sm">
          <Link to="/" className="text-white/50 transition hover:text-gold">
            Voltar ao início
          </Link>
        </p>
      </form>
    </div>
  );
}
