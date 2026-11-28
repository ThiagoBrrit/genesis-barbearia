import { useCallback, useEffect, useState } from 'react';
import { POLLING_INTERVAL_MS } from '@/config';
import { supabase } from '@/lib/supabase';
import {
  buscarBarbeiros,
  buscarFilaDeHoje,
  type Barbeiro,
  type ClienteFila,
} from '@/lib/queue';

export type StatusFila = 'carregando' | 'pronto' | 'erro';

export function useFila() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [clientes, setClientes] = useState<ClienteFila[]>([]);
  const [status, setStatus] = useState<StatusFila>('carregando');

  const atualizar = useCallback(async () => {
    try {
      const [listaBarbeiros, listaClientes] = await Promise.all([
        buscarBarbeiros(),
        buscarFilaDeHoje(),
      ]);
      setBarbeiros(listaBarbeiros);
      setClientes(listaClientes);
      setStatus('pronto');
    } catch {
      setStatus('erro');
    }
  }, []);

  useEffect(() => {
    atualizar();
    const canal = supabase
      .channel('fila-publica')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fila' }, () => {
        atualizar();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barbeiros' }, () => {
        atualizar();
      })
      .subscribe();
    const intervalo = window.setInterval(atualizar, POLLING_INTERVAL_MS);
    return () => {
      supabase.removeChannel(canal);
      window.clearInterval(intervalo);
    };
  }, [atualizar]);

  const removerLocalmente = useCallback((id: string) => {
    setClientes((atuais) => atuais.filter((c) => c.id !== id));
  }, []);

  return { barbeiros, clientes, status, atualizar, removerLocalmente };
}
