import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { loginBarbeiro } from '@/lib/queue';
import { lerSessao, salvarSessao } from '@/lib/sessaoBarbeiro';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (lerSessao() !== null) return <Navigate to="/admin/painel" replace />;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (usuario.trim() === '' || senha === '') {
      setErro('Digite seu usuário e sua senha.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const sessao = await loginBarbeiro(usuario, senha);
      salvarSessao(sessao);
      navigate('/admin/painel', { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
      setEnviando(false);
    }
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

        {erro && (
          <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {erro}
          </p>
        )}

        <button type="submit" disabled={enviando} className="btn-gold w-full">
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
