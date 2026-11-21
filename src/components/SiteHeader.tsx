import { Link } from 'react-router-dom';
import { BRAND_NAME } from '@/config';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-gold/15 bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 md:px-8">
        {/* LOGO: arquivo em public/images/logo-genesis.webp (fundo transparente).
            Para trocar a logo, substitua esse arquivo mantendo o mesmo nome. */}
        <Link to="/" className="group flex items-center" aria-label={`${BRAND_NAME} Barbearia - início`}>
          <img
            src="/images/logo-genesis.webp"
            alt={`${BRAND_NAME} Barbearia`}
            width={720}
            height={258}
            className="h-12 w-auto transition duration-300 group-hover:scale-[1.03] md:h-14"
          />
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-white/70">
          <Link to="/filas" className="transition hover:text-gold">
            Filas
          </Link>
          <Link to="/admin" className="transition hover:text-gold">
            Barbeiro
          </Link>
        </nav>
      </div>
    </header>
  );
}
