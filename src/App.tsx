import { Navigate, Route, Routes } from 'react-router-dom';
import SiteHeader from '@/components/SiteHeader';
import HomePage from '@/pages/HomePage';
import BookingPage from '@/pages/BookingPage';
import ConfirmacaoPage from '@/pages/ConfirmacaoPage';
import QueuePage from '@/pages/QueuePage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import BarberPanelPage from '@/pages/BarberPanelPage';

export default function App() {
  return (
    <div className="min-h-screen bg-ink text-white">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-6 md:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/marcar" element={<BookingPage />} />
          <Route path="/marcar/confirmado" element={<ConfirmacaoPage />} />
          <Route path="/filas" element={<QueuePage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/painel" element={<BarberPanelPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
