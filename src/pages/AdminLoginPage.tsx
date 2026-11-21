import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { ADMIN_PASSWORD, ADMIN_USER } from '@/config';
import { useFila } from '@/hooks/useFila';
import { lerSessao, salvarSessao } from '@/lib/sessaoBarbeiro';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { barbeiros, status } = useFila();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [barbeiroId, setBarbeiroId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (lerSessao() !== null) return <Navigate to="/admin/painel" replace />;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (usuario.trim() !== ADMIN_USER || senha !== ADMIN_PASSWORD) {
      setErro('Usuário ou senha incorretos.');
      return;
    }
    if (barbeiroId === null) {
      setErro('Escolha qual barbeiro é você.');
      return;
    }
    salvarSessao(barbeiroId);
    navigate('/admin/painel', { replace: true });
  };

  const campoClasse =
    'w-full rounded-xl border border-ink-line bg-ink px-4 py-3.5 text-base text-white placeholder-white/30 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20';

  return (
    <div className="mx-auto max-w-md space-y-8 pt-6 animate-fade-in md:pt-12">
      <section className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">Área restrita</p>
        <h1 className="mt-4 font-display text-4xl text-white">Entrar</h1>
        <p className="mt-3 text-sm text-white/60">Acesso exclusivo para os barbeiros.</p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-ink-line bg-ink-soft p-6 sm:p-8">
        <div className="space-y-2">
          <label htmlFor="usuario" className="text-sm font-medium text-white/80">
            Usuário
          </label>
          <div className="relative">
            <User size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              className={`${campoClasse} pl-11`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="senha" className="text-sm font-medium text-white/80">
            Senha
          </label>
          <div className="relative">
            <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              className={`${campoClasse} pl-11`}
            />
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-medium text-white/80">Você é qual barbeiro?</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {barbeiros.map((barbeiro) => (
              <button
                key={barbeiro.id}
                type="button"
                aria-pressed={barbeiroId === barbeiro.id}
                onClick={() => setBarbeiroId(barbeiro.id)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium transition duration-200 active:scale-[0.98] ${
                  barbeiroId === barbeiro.id
                    ? 'border-gold bg-gold text-ink'
                    : 'border-ink-line bg-ink text-white/80 hover:border-white/30'
                }`}
              >
                {barbeiro.nome}
              </button>
            ))}
          </div>
          {status !== 'carregando' && barbeiros.length === 0 && (
            <p className="text-sm text-red-400">Não foi possível carregar os barbeiros.</p>
          )}
        </fieldset>

        {erro && (
          <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {erro}
          </p>
        )}

        <button type="submit" className="btn-gold w-full">
          Entrar
        </button>
      </form>
    </div>
  );
}
