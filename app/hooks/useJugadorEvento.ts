// ══════════════════════════════════════════════════════════════
//  useJugadorEvento.ts
//  FASE 9 — Hook para manejar el estado del jugador en un evento
//
//  UBICACIÓN: src/hooks/useJugadorEvento.ts
//
//  USO:
//    const {
//      inscrito, estado, loading, saldo,
//      abrirModal, cerrarModal, mostrarModal,
//      handleJoinSuccess,
//    } = useJugadorEvento(eventoId);
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { JoinResult } from '@/app/components/game/JoinEventModal';

// ── Tipos alineados con Prisma: JugadorEvento ─────────────────
export interface EstadoJugador {
  vidas: number;
  status: 'ACTIVO' | 'EN_COMA' | 'GANADOR' | 'ABANDONADO';
  racha_actual: number;
  racha_maxima: number;
  partidos_jugados: number;
  aciertos_totales: number;
  fecha_ingreso?: string;
}

export interface UseJugadorEventoReturn {
  inscrito:     boolean;
  estado:       EstadoJugador | null;
  saldo:        number;       // pitchx_balance del jugador
  loading:      boolean;
  mostrarModal: boolean;
  abrirModal:   () => void;
  cerrarModal:  () => void;
  handleJoinSuccess: (res: JoinResult) => void;
  refetch:      () => Promise<void>;
}

export function useJugadorEvento(eventoId: string | null): UseJugadorEventoReturn {
  const [inscrito,     setInscrito]     = useState(false);
  const [estado,       setEstado]       = useState<EstadoJugador | null>(null);
  const [saldo,        setSaldo]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);

  const fetchEstado = useCallback(async () => {
    if (!eventoId) { setLoading(false); return; }
    setLoading(true);
    try {
      // 1. Obtener saldo del jugador
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('pitchx_balance')
        .eq('id', user.id)
        .maybeSingle();

      setSaldo(profile?.pitchx_balance ?? 0);

      // 2. Verificar inscripción al evento
      const res = await fetch(`/api/juego/unirse?evento_juego_id=${eventoId}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();

      setInscrito(data.inscrito ?? false);
      if (data.inscrito && data.estado) {
        setEstado(data.estado as EstadoJugador);
      }
    } catch (err) {
      console.error('[useJugadorEvento] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [eventoId]);

  useEffect(() => {
    fetchEstado();
  }, [fetchEstado]);

  const handleJoinSuccess = useCallback((res: JoinResult) => {
    setMostrarModal(false);
    setSaldo(res.saldo_nuevo);
    setInscrito(true);
    setEstado({
      vidas:           res.vidas_asignadas,
      status:          'ACTIVO',
      racha_actual:    0,
      racha_maxima:    0,
      partidos_jugados: 0,
      aciertos_totales: 0,
    });
  }, []);

  return {
    inscrito,
    estado,
    saldo,
    loading,
    mostrarModal,
    abrirModal:  () => setMostrarModal(true),
    cerrarModal: () => setMostrarModal(false),
    handleJoinSuccess,
    refetch:     fetchEstado,
  };
}