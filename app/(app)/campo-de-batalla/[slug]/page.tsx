"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Heart, BarChart2, Clock, MapPin,
  Play, CheckCircle, AlertTriangle, Trophy,
  ChevronRight, Flame, Calendar, Activity, Lock, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './campo.module.css';

interface Jugador {
  id: string; nombre: string; codigo: string;
  vidas: number; creditos: number; racha: number; avatar_url?: string;
}

interface Partido {
  id: string;
  equipo_local: string; equipo_visitante: string;
  hora_inicio: string; ciudad: string; estadio: string;
  flag_local: string; flag_visitante: string;
  estado: 'PROXIMAMENTE' | 'EN_VIVO' | 'FINALIZADO' | 'PROGRAMADO';
  resultado_local?: number; resultado_visitante?: number;
  cuota_1?: number; cuota_x?: number; cuota_2?: number;
  apuestas_activas?: boolean;
  predicho?: boolean;
  es_correcta?: boolean | null;
  predicciones_jugador?: ResumenPrediccion[];
  fecha_prediccion_desde?: string | null;
}

interface Pregunta {
  id: string; categoria: string; texto: string;
  opciones: { id: string; texto: string; cuota?: string }[];
}

interface ResumenPrediccion { pregunta: string; respuesta: string; }

type Fase = 'lista' | 'prediciendo' | 'sellado';

const NIVELES: Record<number, { preguntas: number; segundos: number; categorias: string[] }> = {
  1: { preguntas: 1,  segundos: 540, categorias: ['resultado'] },
  2: { preguntas: 2,  segundos: 420, categorias: ['resultado', 'goles'] },
  3: { preguntas: 3,  segundos: 360, categorias: ['resultado', 'goles', 'tarjetas'] },
  4: { preguntas: 5,  segundos: 300, categorias: ['resultado', 'goles', 'tarjetas', 'corners', 'var'] },
  5: { preguntas: 7,  segundos: 210, categorias: ['resultado', 'goles', 'tarjetas', 'corners', 'var', 'penales', 'posesion'] },
  6: { preguntas: 9,  segundos: 150, categorias: ['resultado', 'goles', 'tarjetas', 'var', 'penales', 'tanda_penales', 'faltas', 'manos', 'eventos_especiales'] },
  7: { preguntas: 10, segundos: 120, categorias: ['resultado', 'goles', 'tarjetas', 'var', 'penales', 'tanda_penales', 'faltas', 'manos', 'posesion', 'eventos_especiales'] },
};

// Calcula el nivel según el % de avance del torneo
// Funciona para cualquier torneo sin importar el número de partidos
const calcularNivel = (partidoActual: number, totalPartidos: number): number => {
  const pct = totalPartidos > 0 ? partidoActual / totalPartidos : 0;
  if (pct <= 0.15) return 1; // Recluta   — 0-15%
  if (pct <= 0.30) return 2; // Soldado   — 15-30%
  if (pct <= 0.46) return 3; // Guerrero  — 30-46%
  if (pct <= 0.62) return 4; // Élite     — 46-62%
  if (pct <= 0.77) return 5; // Maestro   — 62-77%
  if (pct <= 0.93) return 6; // Leyenda   — 77-93%
  return 7;                  // Final     — 93-100%
};

const PREGUNTAS_FALLBACK: Pregunta[] = [
  {
    id: 'resultado', categoria: 'RESULTADO FINAL',
    texto: '¿Cuál será el resultado final del partido?',
    opciones: [
      { id: '1', texto: 'Gana el equipo local' },
      { id: 'X', texto: 'Empate' },
      { id: '2', texto: 'Gana el equipo visitante' },
    ]
  },
  {
    id: 'goles', categoria: 'TOTAL DE GOLES',
    texto: '¿Cuántos goles habrá en total?',
    opciones: [
      { id: '0-1', texto: '0 o 1 gol' },
      { id: '2',   texto: 'Exactamente 2' },
      { id: '3',   texto: '3 goles' },
      { id: '4+',  texto: '4 o más goles' },
    ]
  },
  {
    id: 'primer_gol', categoria: 'PRIMER GOL',
    texto: '¿Quién anotará el primer gol?',
    opciones: [
      { id: 'local',     texto: 'Equipo local' },
      { id: 'visitante', texto: 'Equipo visitante' },
      { id: 'ninguno',   texto: 'Sin goles' },
    ]
  },
  {
    id: 'tarjetas', categoria: 'TARJETAS',
    texto: '¿Habrá tarjeta roja en el partido?',
    opciones: [
      { id: 'no_roja',     texto: 'No habrá tarjeta roja' },
      { id: 'roja_local',  texto: 'Roja para el equipo local' },
      { id: 'roja_visita', texto: 'Roja para el equipo visitante' },
      { id: 'roja_ambos',  texto: 'Rojas para ambos equipos' },
    ]
  },
];

/* ── Determina si un partido puede ser predicho ahora ── */
const puedePredecirsе = (partido: Partido): { puede: boolean; razon: string } => {
  if (partido.estado === 'FINALIZADO') return { puede: false, razon: 'cerrado' };
  if (partido.estado === 'EN_VIVO') return { puede: false, razon: 'cerrado' };
  return { puede: true, razon: '' };
};
  

function Splash({ torneo }: { torneo: string }) {
  const [err, setErr] = useState(false);
  return (
    <div className={styles.splash}>
      {!err
        ? <img src="/img/kicklast02.png" alt="Kick Last"
            className={styles.splashLogo} onError={() => setErr(true)} />
        : <span className={styles.splashLogoFb}>KICK LAST</span>}
      <div className={styles.splashDots}>
        <div className={styles.splashDot} />
        <div className={styles.splashDot} />
        <div className={styles.splashDot} />
      </div>
      <div className={styles.splashText}>CARGANDO · {torneo.toUpperCase()}</div>
    </div>
  );
}
const HERO_SLIDES = [
  {
    badge: 'TORNEO OFICIAL',
    badgeColor: '#00C853',
    badgeBg: 'rgba(0,200,83,0.15)',
    title: 'COPA KICKLAST 2026',
    desc: 'Cada partido es una oportunidad. Acumula aciertos y domina la tabla.',
    bg: "linear-gradient(90deg, rgba(0,0,0,.9) 0%, rgba(0,0,0,.4) 100%), url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55')"
  },
  {
    badge: 'MODO EXTREMO',
    badgeColor: '#00C853',
    badgeBg: 'rgba(0,200,83,0.15)',
    title: 'JUEGA A PREDECIR',
    desc: 'Juego de supervivencia. Un solo error y quedas eliminado.',
    bg: "linear-gradient(90deg, rgba(0,0,0,.95) 0%, rgba(0,200,83,.2) 100%), url('https://images.unsplash.com/photo-1508344928928-720b70852d11')"
  },
  {
    badge: 'ESPACIO PUBLICITARIO',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56,189,248,0.15)',
    title: 'TU MARCA AQUÍ',
    desc: 'Llega a miles de jugadores diarios en el juegoS de predicciones más grande.',
    bg: "linear-gradient(90deg, rgba(0,0,0,.9) 0%, rgba(0,0,0,.4) 100%), url('https://images.unsplash.com/photo-1518605368461-1ed12223f851')"
  }
];

export default function CampoDeBatallaPage() {
  const params = useParams();
  const router = useRouter();
  const slug   = Array.isArray(params?.slug) ? params.slug[0] : params?.slug ?? '';

  const [loading,       setLoading]       = useState(true);
  const [fase,          setFase]          = useState<Fase>('lista');
  const [logoErr,       setLogoErr]       = useState(false);
  const [torneoNombre,  setTorneoNombre]  = useState('MUNDIAL FIFA 2026');
  const [torneoId,      setTorneoId]      = useState('');
  const [fechaSel,      setFechaSel]      = useState('');
  const [estaInscrito,  setEstaInscrito]  = useState(false);
  const [vidasTorneo,   setVidasTorneo]   = useState<number | null>(null);
  const [apuestaPartido,    setApuestaPartido]    = useState<string | null>(null);
const [montoApuesta,      setMontoApuesta]      = useState('');
const [procesandoApuesta, setProcesandoApuesta] = useState(false);

  const [jugador, setJugador] = useState<Jugador>({
    id: '', nombre: 'RECLUTA', codigo: 'LK-000000',
    vidas: 0, creditos: 0, racha: 0,
  });

  const [partidos,      setPartidos]      = useState<Partido[]>([]);
  const [todasFechas,   setTodasFechas]   = useState<string[]>([]);
  const [partidoActivo, setPartidoActivo] = useState<Partido | null>(null);
  const [predicciones,  setPredicciones]  = useState<Record<string, string>>({});
  const [resultados, setResultados] = useState<Record<string, boolean|null>>({});
  const [resumen,       setResumen]       = useState<ResumenPrediccion[]>([]);
  const [preguntaIdx,   setPreguntaIdx]   = useState(0);
  const [seleccion,     setSeleccion]     = useState<string | null>(null);
  const [confirmando,   setConfirmando]   = useState(false);

  const [preguntasActivas,  setPreguntasActivas]  = useState<Pregunta[]>([]);
  const [cargandoPreguntas, setCargandoPreguntas] = useState(false);
  const [tiempoTotal,       setTiempoTotal]       = useState(540);
  const [tiempoLeft,        setTiempoLeft]        = useState(540);
  const [cronActivo,        setCronActivo]        = useState(false);
  const cronRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /* ── Motor Carrusel Hero ── */
const carouselRef = useRef<HTMLDivElement>(null);
const [slideIdx, setSlideIdx] = useState(0);
const TOTAL_SLIDES = 3;

useEffect(() => {
  const autoPlay = setInterval(() => {
    setSlideIdx(prev => (prev + 1) % TOTAL_SLIDES);
  }, 4500);
  return () => clearInterval(autoPlay);
}, []);

useEffect(() => {
  if (carouselRef.current) {
    const slideWidth = carouselRef.current.clientWidth;
    carouselRef.current.scrollTo({
      left: slideIdx * slideWidth,
      behavior: 'smooth',
    });
  }
}, [slideIdx]);

  /* ══════════════════════════════════════
     INIT — carga torneo + jugador + partidos
     ══════════════════════════════════════ */
  useEffect(() => {
    const init = async () => {
      // 1. Auth primero
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // 2. Torneo y perfil en paralelo
      // Detectar si es UUID (partido individual) o slug (torneo)
const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

const [torneoRes, perfilRes] = await Promise.all([
  esUUID
    ? supabase.from('matches').select('id, home_team, away_team').eq('id', slug).maybeSingle()
    : supabase.from('tournaments').select('id, name').eq('slug', slug).maybeSingle(),
        supabase.from('profiles')
          .select('username, full_name, player_code, lives, pitchx_balance, pitx_balance, streak, referral_code')
          .eq('id', user.id).maybeSingle()
      ]);

      const t = torneoRes.data;
const p = perfilRes.data;

// Torneo o partido individual
let idTorneo = '';
if (t) {
  if (esUUID) {
    // Es un partido individual
    setTorneoNombre(`${(t as any).home_team} vs ${(t as any).away_team}`);
    setTorneoId('');
    idTorneo = '';
    setEstaInscrito(true); // Individual no requiere inscripción
  } else {
    setTorneoNombre((t as any).name);
    setTorneoId(t.id);
    idTorneo = t.id;

    // Verificar inscripción al torneo
    const { data: entrada } = await supabase
      .from('tournament_entries')
      .select('id, vidas, status')
      .eq('tournament_id', t.id)
      .eq('user_id', user.id)
      .maybeSingle();
    setEstaInscrito(!!entrada);
    if (entrada) {
      setVidasTorneo(entrada.vidas ?? null);
    }
  }
}

      // Perfil del jugador — siempre disponible antes de renderizar
      if (p) {
        // Usar pitchx_balance si existe, sino pitx_balance (columna duplicada en DB)
        const creditos = p.pitchx_balance ?? p.pitx_balance ?? 0;
        setJugador({
          id:       user.id,
          nombre:   p.username    || p.full_name  || 'RECLUTA',
          codigo:   p.player_code || p.referral_code || 'LK-000000',
          vidas:    p.lives       ?? 0,
          creditos: creditos,
          racha:    p.streak      ?? 0,
        });
      }

      // 3. Partidos
      // 3. Partidos
if (esUUID) {
  // Partido individual — cargar solo ese match
  const { data: matchInd } = await supabase
    .from('matches').select('*').eq('id', slug).maybeSingle();
  
  if (matchInd) {
    const { data: yaPredichos } = await supabase.from('predictions')
      .select('match_id, is_correct').eq('user_id', user.id)
      .eq('match_id', slug).eq('question_id', '0c3dc09c-a149-4aed-8301-5cd84249721c');
    const yaPredicho = (yaPredichos || []).length > 0;
    const isCorrecta = yaPredicho ? (yaPredichos![0].is_correct ?? null) : null;

    const lista: Partido[] = [{
      id:               matchInd.id,
      equipo_local:     matchInd.home_team  || 'Local',
      equipo_visitante: matchInd.away_team  || 'Visitante',
      hora_inicio:      matchInd.match_date,
      ciudad:           matchInd.city       || '',
      estadio:          matchInd.stadium    || '',
      flag_local:       matchInd.home_flag  || 'un',
      flag_visitante:   matchInd.away_flag  || 'un',
      estado:           matchInd.status === 'FINALIZADO' ? 'FINALIZADO' :
                        matchInd.status === 'EN_VIVO'    ? 'EN_VIVO'    : 'PROXIMAMENTE',
      resultado_local:      matchInd.home_score ?? undefined,
      resultado_visitante:  matchInd.away_score ?? undefined,
      cuota_1: matchInd.cuota_1 || null,
      cuota_x: matchInd.cuota_x || null,
      cuota_2: matchInd.cuota_2 || null,
      apuestas_activas: matchInd.apuestas_activas || false,
      predicho: yaPredicho,
      es_correcta: isCorrecta,
    }];

    const fecha = matchInd.match_date.split('T')[0];
    setTodasFechas([fecha]);
    setPartidos(lista);
    setFechaSel(fecha);
  }
} else if (idTorneo) {
        // Verificar si es combinada
        const { data: torneoCompleto } = await supabase
          .from('tournaments').select('tipo_evento, partidos_combinada')
          .eq('id', idTorneo).maybeSingle();

        let pts: any[] = [];

        if (torneoCompleto?.tipo_evento === 'COMBINADA' && Array.isArray(torneoCompleto.partidos_combinada)) {
          // Para combinadas: construir partidos desde el jsonb
          pts = torneoCompleto.partidos_combinada.map((p: any) => ({
            id:               p.partido_id,
            home_team:        p.home_team  || 'Local',
            away_team:        p.away_team  || 'Visitante',
            match_date:       p.match_date || new Date().toISOString(),
            city:             '',
            stadium:          '',
            home_flag:        'un',
            away_flag:        'un',
            status:           'PROXIMAMENTE',
            home_score:       null,
            away_score:       null,
            cuota_1:          p.cuota_1 || null,
            cuota_x:          p.cuota_x || null,
            cuota_2:          p.cuota_2 || null,
            match_number:     p.orden || 1,
            is_live:          false,
          }));
        } else {
          // Para torneos normales: buscar en matches
          const { data: matchesPts } = await supabase
            .from('matches').select('*')
            .eq('tournament_id', idTorneo)
            .order('match_date', { ascending: true });
          pts = matchesPts || [];
        }

        if (pts && pts.length > 0) {
          const matchIds = pts.map((m: any) => m.id);
          const { data: yaPredichos } = await supabase.from('predictions')
            .select('match_id, is_correct').eq('user_id', user.id)
            .in('match_id', matchIds).eq('question_id', '0c3dc09c-a149-4aed-8301-5cd84249721c');
          const predichoIds = new Set((yaPredichos || []).map((pr: any) => pr.match_id));
          const resultadoMap = new Map((yaPredichos || []).map((pr: any) => [pr.match_id, pr.is_correct]));
          setResultados(Object.fromEntries(resultadoMap));

          const lista = pts.map((m: any): Partido => ({
            id:               m.id,
            equipo_local:     m.home_team  || 'Local',
            equipo_visitante: m.away_team  || 'Visitante',
            hora_inicio:      m.match_date,
            ciudad:           m.city       || 'Ciudad',
            estadio:          m.stadium    || 'Estadio',
            flag_local:       m.home_flag  || 'un',
            flag_visitante:   m.away_flag  || 'un',
            estado: (
              m.is_live                                             ? 'EN_VIVO'    :
              m.status === 'FINALIZADO' || m.status === 'finished' ? 'FINALIZADO' :
              m.status === 'EN_VIVO'                               ? 'EN_VIVO'    :
                                                                     'PROXIMAMENTE'
            ) as Partido['estado'],
            resultado_local:      m.home_score ?? undefined,
            resultado_visitante:  m.away_score ?? undefined,
            cuota_1: m.cuota_1 || null,
            cuota_x: m.cuota_x || null,
            cuota_2: m.cuota_2 || null,
            apuestas_activas: m.apuestas_activas || false,
            predicho: predichoIds.has(m.id),
            es_correcta: resultadoMap.has(m.id) ? resultadoMap.get(m.id) : null,
            fecha_prediccion_desde: m.fecha_prediccion_desde || null,
          }));

          const fechas: string[] = Array.from(
            new Set(lista.map((p: Partido) => p.hora_inicio.split('T')[0]))
          ).sort();

          setTodasFechas(fechas);
          setPartidos(lista);
          // Detectar jornada activa — la fecha más próxima con partidos PROXIMAMENTE
          const hoy = new Date().toISOString().split('T')[0];
          
          // Buscar la primera fecha que tenga partidos PROXIMAMENTE
          const jornadaActiva = fechas.find(fecha => 
            lista.some(p => p.hora_inicio.split('T')[0] === fecha && p.estado === 'PROXIMAMENTE')
          );
          
          // Si no hay jornada activa (todos finalizados) mostrar la última
          setFechaSel(jornadaActiva || fechas[fechas.length - 1]);
        }
      }

      setTimeout(() => setLoading(false), 800);
    };
    init();
  }, [slug, router]);

  /* ══════════════════════════════════════
     CARGAR PREGUNTAS
     ══════════════════════════════════════ */
  const cargarPreguntas = useCallback(async (numeroPartido: number, totalPartidos: number = partidos.length || 104) => {
    setCargandoPreguntas(true);
    try {
      const nivel  = calcularNivel(numeroPartido, totalPartidos);
      const config = NIVELES[nivel] || NIVELES[1];

      const resResultado = await fetch(`/api/preguntas?categorias=resultado&limite=10`);
const dataResultado: any[] = resResultado.ok ? await resResultado.json() : [];
const pregResultadoPrincipal = dataResultado.find((p: any) => p.id === '0c3dc09c-a149-4aed-8301-5cd84249721c');
const pregResultado = pregResultadoPrincipal ? [pregResultadoPrincipal] : [...dataResultado].sort(() => Math.random() - 0.5).slice(0, 1);

      const categoriasResto = config.categorias.filter(c => c !== 'resultado');
      const numResto        = config.preguntas - 1;

      const resResto = await fetch(`/api/preguntas?categorias=${categoriasResto.join(',')}&limite=80`);
      const dataResto: any[] = resResto.ok ? await resResto.json() : [];
      const pregResto = [...dataResto].sort(() => Math.random() - 0.5).slice(0, numResto);

      const todas = [...pregResultado, ...pregResto];

      if (todas.length === 0) {
        setPreguntasActivas(PREGUNTAS_FALLBACK);
        setTiempoTotal(540); setTiempoLeft(540);
        return;
      }

      const formateadas: Pregunta[] = todas.map((p: any) => ({
        id:        p.id,
        categoria: (p.categoria as string).toUpperCase().replace(/_/g, ' '),
        texto:     p.pregunta,
        opciones:  Array.isArray(p.opciones_pregunta)
          ? (p.opciones_pregunta as any[])
              .sort(() => Math.random() - 0.5)
              .map((o: any) => ({ id: String(o.id), texto: String(o.texto) }))
          : [],
      }));
      const conOpciones = formateadas.filter(p => p.opciones.length >= 2);
      

      if (conOpciones.length === 0) {
        setPreguntasActivas(PREGUNTAS_FALLBACK);
        setTiempoTotal(540); setTiempoLeft(540);
        return;
      }

      setPreguntasActivas(conOpciones);
      setTiempoTotal(config.segundos);
      setTiempoLeft(config.segundos);

    } catch (e) {
      console.error('Error cargando preguntas:', e);
      setPreguntasActivas(PREGUNTAS_FALLBACK);
      setTiempoTotal(540); setTiempoLeft(540);
    } finally {
      setCargandoPreguntas(false);
    }
  }, []);

  /* ══ Cronómetro ══ */
  useEffect(() => {
    if (!cronActivo) return;
    cronRef.current = setInterval(() => {
      setTiempoLeft(prev => {
        if (prev <= 1) {
          clearInterval(cronRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cronRef.current!);
  }, [cronActivo]);

  // Cuando el tiempo llega a 0 → sellar automáticamente
  useEffect(() => {
    if (tiempoLeft === 0 && cronActivo && fase === 'prediciendo') {
      setCronActivo(false);
      guardarPredicciones(predicciones, resumen);
    }
  }, [tiempoLeft]);

  /* ══ Abrir predicción ══ */
  const abrirPrediccion = async (partido: Partido) => {
    setPartidoActivo(partido);
    setPredicciones({}); setResumen([]);
    setPreguntaIdx(0);   setSeleccion(null);
    setConfirmando(false);
    setFase('prediciendo');
    setCronActivo(false);
    setPreguntasActivas([]);
    const idx = partidos.findIndex(p => p.id === partido.id);
    const esIndividual = !torneoId;
    await cargarPreguntas(idx + 1, esIndividual ? 1 : partidos.length);
    setCronActivo(false);
  };

  /* ══ Confirmar opción ══ */
  const confirmarOpcion = async () => {
    if (!seleccion || confirmando || !partidoActivo || preguntasActivas.length === 0) return;
    setConfirmando(true);
    const pregunta     = preguntasActivas[preguntaIdx];
    const opcion       = pregunta.opciones.find(o => o.id === seleccion);
    const nuevas       = { ...predicciones, [pregunta.id]: seleccion };
    const nuevoResumen = [...resumen, { pregunta: pregunta.categoria, respuesta: opcion?.texto || seleccion }];
    setPredicciones(nuevas); setResumen(nuevoResumen);
    await new Promise(r => setTimeout(r, 350));
    if (preguntaIdx < preguntasActivas.length - 1) {
      setPreguntaIdx(i => i + 1); setSeleccion(null); setConfirmando(false);
    } else {
      setCronActivo(false); clearInterval(cronRef.current!);
      await guardarPredicciones(nuevas, nuevoResumen);
    }
  };
  /* ══ Realizar apuesta por cuota ══ */
  const hacerApuesta = async (partido: Partido, opcion: '1' | 'X' | '2') => {
    if (!jugador.id) return;
    const monto = parseInt(montoApuesta);
    if (!monto || monto <= 0) { return; }
    if (monto > jugador.creditos) { return; }
    setProcesandoApuesta(true);
    try {
      const { data:{ session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/apuestas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          evento_id:         partido.id,
          monto:             monto,
          resultado_elegido: opcion,
        })
      });
      if (res.ok) {
        setJugador(prev => ({ ...prev, creditos: prev.creditos - monto }));
        setMontoApuesta('');
        setApuestaPartido(null);
      }
    } catch (e) { console.error(e); }
    finally { setProcesandoApuesta(false); }
  };

  /* ══ Guardar predicciones ══ */
  const guardarPredicciones = async (resp: Record<string, string>, res: ResumenPrediccion[]) => {
    try {
      console.log('Guardando predicciones:', Object.keys(resp).length, 'jugador:', jugador.id, 'partido:', partidoActivo?.id);
      if (jugador.id && partidoActivo) {
        
        const filasBanco = Object.entries(resp).map(([question_id, answer_id]) => ({
          user_id:       jugador.id,
          match_id:      partidoActivo.id,
          tournament_id: torneoId || null,
          question_id,
          answer_id,
          answers:       resp,
          status:        'pending',
          sealed_at:     new Date().toISOString(),
        }));
        await supabase.from('predictions').insert(filasBanco);
        setPartidos(ps => ps.map(p =>
          p.id === partidoActivo!.id ? { ...p, predicho: true, predicciones_jugador: res } : p
        ));
      }
    } catch (e) { console.error('ERROR GUARDANDO:', e); }
    setFase('sellado');
  };

  /* ══ Helpers ══ */
  const pad       = (n: number) => String(n).padStart(2, '0');
  const mins      = Math.floor(tiempoLeft / 60);
  const secs      = tiempoLeft % 60;
  const pctCron   = tiempoTotal > 0 ? tiempoLeft / tiempoTotal : 1;
  const cronColor = pctCron > 0.5 ? '#8dc63f' : pctCron > 0.2 ? '#f59e0b' : '#ef4444';

  const formatHora = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }); }
    catch { return iso; }
  };

  const formatFecha = (iso: string) => {
    try { return new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase(); }
    catch { return iso; }
  };

  const labelFecha = (f: string) => {
    const hoy    = new Date().toISOString().split('T')[0];
    const manana = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    if (f === hoy)    return 'HOY';
    if (f === manana) return 'MAÑANA';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }).toUpperCase();
  };

  const getEstadoBadge = (partido: Partido) => {
    if (partido.predicho)             return { clase: styles.estadoPredicho,   texto: '✓ Predicho' };
    if (partido.estado === 'EN_VIVO') return { clase: styles.estadoEnVivo,     texto: '● En vivo' };
    if (partido.estado === 'FINALIZADO') return { clase: styles.estadoFinalizado, texto: 'Finalizado' };
    const { puede, razon } = puedePredecirsе(partido);
    if (!puede && razon === 'muy_pronto') return { clase: styles.estadoProximo,   texto: '⏳ Próximamente' };
    if (!puede && razon === 'cerrado')    return { clase: styles.estadoEnVivo,    texto: 'Cerrado' };
    return { clase: styles.estadoProximo, texto: '🟡 Abierto' };
  };

  const hoyFecha = new Date().toISOString().split('T')[0];

// Fecha activa: hoy si hay partidos (activos O finalizados), sino próxima fecha
const hayHoy = partidos.some(p => p.hora_inicio.split('T')[0] === hoyFecha);
const fechaActiva = hayHoy ? hoyFecha : (
  todasFechas.find(f => f >= hoyFecha && partidos.some(p => p.hora_inicio.split('T')[0] === f && p.estado !== 'FINALIZADO')) || hoyFecha
);
const partidosDelDia = partidos.filter(p => p.hora_inicio.split('T')[0] === fechaActiva);
const partidosActivos   = partidosDelDia.filter(p => p.estado !== 'FINALIZADO');
const partidosFinalizados = partidos.filter(p => p.estado === 'FINALIZADO');
const predichos         = partidosDelDia.filter(p => p.predicho).length;
const totalDelDia       = partidosDelDia.length;

// Si todos los partidos de la jornada están finalizados → avanzar a la siguiente jornada
const todosFinalizados = totalDelDia > 0 && partidosDelDia.every(p => p.estado === 'FINALIZADO');
const siguienteJornada = todosFinalizados
  ? todasFechas.find(f => f > fechaSel && partidos.some(p => p.hora_inicio.split('T')[0] === f && p.estado === 'PROXIMAMENTE'))
  : null;

  if (loading) return <Splash torneo={torneoNombre} />;

  /* ══ PANTALLA SELLADO ══ */
  if (fase === 'sellado' && partidoActivo) {
    const hoy = new Date().toISOString().split('T')[0];
    const partidosHoy = partidos.filter(p => p.hora_inicio.split('T')[0] === hoy);
    const pendientesHoy = partidosHoy.filter(p => !p.predicho && p.estado !== 'FINALIZADO' && p.estado !== 'EN_VIVO');
    const hayMasHoy = pendientesHoy.length > 0;

    return (
      <div className={styles.selladoWrap}>
        <motion.div className={styles.selladoCard}
          initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
          transition={{ duration:0.4 }}>
          <motion.div className={styles.selladoIcono}
            initial={{ scale:0 }} animate={{ scale:1 }}
            transition={{ type:'spring', stiffness:200, damping:14, delay:0.2 }}>
            <CheckCircle size={36} style={{ color:'#8dc63f' }} />
          </motion.div>
          <div className={styles.selladoTitulo}>¡Predicción sellada!</div>
          <div className={styles.selladoSub}>
            Tus predicciones para{' '}
            <strong style={{ color:'#fff' }}>
              {partidoActivo.equipo_local} vs {partidoActivo.equipo_visitante}
            </strong>{' '}han sido guardadas.
          </div>
          <div style={{ width:'100%' }}>
            {resumen.map((r, i) => (
              <div key={i} className={styles.resumenItem}>
                <span className={styles.resumenPregunta}>{r.pregunta}</span>
                <span className={styles.resumenRespuesta}>{r.respuesta}</span>
              </div>
            ))}
          </div>

          {/* Alerta de partidos disponibles */}
          {hayMasHoy ? (
            <div style={{
              width:'100%', padding:'12px 16px',
              background:'rgba(141,198,63,.08)',
              border:'1px solid rgba(141,198,63,.25)',
              borderRadius:8, display:'flex', alignItems:'center', gap:10
            }}>
              <Trophy size={16} style={{ color:'#8dc63f', flexShrink:0 }}/>
              <div>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, fontWeight:700, color:'#8dc63f' }}>
                  ¡Hay {pendientesHoy.length} partido{pendientesHoy.length > 1 ? 's' : ''} más para predecir hoy!
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>
                  Sigue prediciendo para aumentar tus chances de ganar
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              width:'100%', padding:'12px 16px',
              background:'rgba(56,189,248,.06)',
              border:'1px solid rgba(56,189,248,.15)',
              borderRadius:8, display:'flex', alignItems:'center', gap:10
            }}>
              <CheckCircle size={16} style={{ color:'#38bdf8', flexShrink:0 }}/>
              <div>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, fontWeight:700, color:'#38bdf8' }}>
                  ¡Ya prediciste todos los partidos de hoy!
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>
                  Vuelve mañana para predecir más partidos
                </div>
              </div>
            </div>
          )}

          <div className={styles.selladoStats}>
            <div className={styles.selladoStat}><div className={styles.selladoStatVal}>{jugador.vidas}</div><div className={styles.selladoStatLbl}>Vidas</div></div>
            <div className={styles.selladoStat}><div className={styles.selladoStatVal}>{jugador.racha}</div><div className={styles.selladoStatLbl}>Racha</div></div>
            <div className={styles.selladoStat}><div className={styles.selladoStatVal}>{predichos + 1}</div><div className={styles.selladoStatLbl}>Predichos</div></div>
          </div>

          <div className={styles.selladoBtns}>
            <button className={styles.btnSecundario} onClick={() => router.push('/radar')}>← Volver al Radar</button>
            {hayMasHoy ? (
              <button className={styles.btnPrimario} onClick={() => { setFase('lista'); setPartidoActivo(null); setFechaSel(hoy); }}>
                Predecir más →
              </button>
            ) : (
              <button className={styles.btnPrimario} onClick={() => router.push('/radar')}>
                Ver otros eventos →
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

 /* ══ VISTA PRINCIPAL ══ */
  return (
    <div className={styles.root}>
      {/* ── TOPBAR ── */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button className={styles.backBtn} onClick={() => router.push('/radar')}>
            <ChevronLeft size={18}/>
          </button>
          <div className={styles.topbarLogo}>
            {!logoErr
              ? <img src="/img/logo12.png" alt="Kick Last" onError={() => setLogoErr(true)}/>
              : <span className={styles.topbarLogoFb}>KICK LAST</span>}
          </div>
        </div>
        <div className={styles.topbarRight}>
          <div className={styles.topbarStat}>
            <Heart size={12} style={{ color:'#8dc63f' }}/>
            <span className={styles.topbarStatVal}>{vidasTorneo !== null ? vidasTorneo : jugador.vidas}</span>
            <span className={styles.topbarStatLbl}>VIDAS</span>
          </div>
          <div className={styles.topbarStat}>
            <BarChart2 size={12} style={{ color:'#38bdf8' }}/>
            <span className={styles.topbarStatVal}>
              {jugador.creditos >= 1000 ? `${(jugador.creditos/1000).toFixed(1)}K` : jugador.creditos}
            </span>
            <span className={styles.topbarStatLbl}>CRÉDITOS</span>
          </div>
          <div className={styles.topbarStat}>
            <Flame size={12} style={{ color:'#f59e0b' }}/>
            <span className={styles.topbarStatVal}>{jugador.racha}</span>
            <span className={styles.topbarStatLbl}>RACHA</span>
          </div>
        </div>
      </div>

      {/* ── COLUMNA 1: NAVEGACIÓN IZQUIERDA ── */}
      <aside className={styles.leftSidebar}>
        <div className={styles.sideTitle}>NAVEGACIÓN</div>
        <div className={styles.sideMenu}>
          <button className={`${styles.sideBtn} ${styles.active}`}>⚽ Central de Partidos</button>
          <button className={styles.sideBtn}>🏆 Clasificación Global</button>
          <button className={styles.sideBtn}>🎯 Historial de Jugadas</button>
          <button className={styles.sideBtn}>💰 Bolsa de Premios</button>
        </div>
      </aside>

      {/* ── COLUMNA 2: MOTOR CENTRAL ── */}
      <main className={styles.mainContent}>

          {/* ── CARRUSEL HERO ── */}
      <div className={styles.carouselWrapper} ref={carouselRef}>

        {/* Slide 1 */}
        <div className={styles.carouselSlide} style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.3) 100%), url(/img/kick50.jpg) center/cover no-repeat' }}>
          <div className={styles.heroOverlay}>
            <div className={styles.heroBadge} style={{ color: '#00C853', background: 'rgba(0,200,83,0.12)', border: '1px solid rgba(0,200,83,0.3)' }}>⚽ TORNEO OFICIAL</div>
            <h2 className={styles.heroTitle}>COPA KICKLAST 2026</h2>
            <p className={styles.heroDescription}>Cada partido es una oportunidad. Acumula aciertos y domina la tabla.</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <div style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.2)', fontSize: 11, color: '#00C853', fontFamily: "'Oswald',sans-serif", fontWeight: 700 }}>🏆 {partidos.length} PARTIDOS</div>
              <div style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'Oswald',sans-serif", fontWeight: 600 }}>MUNDIAL FIFA 2026</div>
            </div>
          </div>
        </div>

        {/* Slide 2 */}
        <div className={styles.carouselSlide} style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.88) 0%, rgba(0,20,8,.75) 100%), url(/img/kick51.jpg) center/cover no-repeat' }}>
          <div className={styles.heroOverlay}>
            <div className={styles.heroBadge} style={{ color: '#ff4444', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)' }}>⚠ MODO EXTREMO</div>
            <h2 className={styles.heroTitle}>JUEGA A PREDECIR</h2>
            <p className={styles.heroDescription}>Juego de supervivencia. Un solo error y quedas eliminado.</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <div style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', fontSize: 11, color: '#ff6666', fontFamily: "'Oswald',sans-serif", fontWeight: 700 }}>❤ {jugador.vidas} VIDAS RESTANTES</div>
            </div>
          </div>
        </div>

        {/* Slide 3 */}
        <div className={styles.carouselSlide} style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.5) 100%), url(/img/kick3.jpg) center/cover no-repeat' }}>
          <div className={styles.heroOverlay}>
            <div className={styles.heroBadge} style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)' }}>📢 ESPACIO PUBLICITARIO</div>
            <h2 className={styles.heroTitle}>CADA VIDA CUENTA</h2>
            <p className={styles.heroDescription}>Llega a miles de jugadores diarios en la plataforma de predicciones más grande.</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <div style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', fontSize: 11, color: '#38bdf8', fontFamily: "'Oswald',sans-serif", fontWeight: 700 }}>📧 CONTACTAR</div>
            </div>
          </div>
        </div>

      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: -12, marginBottom: 24, position: 'relative', zIndex: 2 }}>
        {[0, 1, 2].map(i => (
          <button key={i} onClick={() => setSlideIdx(i)} style={{ width: slideIdx === i ? 24 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', background: slideIdx === i ? '#00C853' : 'rgba(255,255,255,0.15)', transition: 'all 0.3s', padding: 0 }} />
        ))}
      </div>

<div className={styles.body}>
          {/* ── HEADER DEL DÍA ── */}
          <div className={styles.dayHeader}>
            <div>
              <div className={styles.dayTorneo}><div className={styles.dayLiveDot}/>{torneoNombre}</div>
              <div className={styles.dayFecha}>{formatFecha(fechaActiva)}</div>
              <div className={styles.daySubtitle}>
                {totalDelDia === 0 ? 'No hay partidos programados para hoy' : `${totalDelDia} partido${totalDelDia > 1 ? 's' : ''} programado${totalDelDia > 1 ? 's' : ''} hoy`}
              </div>
            </div>
            <div>
              <div className={styles.dayProgNum}>{predichos} / {totalDelDia} predicciones</div>
              <div className={styles.dayProgLabel}>Progreso del día</div>
              <div className={styles.dayProgBar}>
                <div className={styles.dayProgFill} style={{ width: totalDelDia > 0 ? `${(predichos/totalDelDia)*100}%` : '0%' }}/>
              </div>
            </div>
          </div>

          {/* ── LISTA DE PARTIDOS ── */}
          {todosFinalizados && siguienteJornada ? (
            <div className={styles.emptyState}>
              <Calendar size={40} style={{ margin:'0 auto', opacity:0.6, display:'block', color:'#8dc63f' }}/>
              <div className={styles.emptyTitle}>¡Jornada completada!</div>
              <div className={styles.emptyDesc}>Todos los partidos de esta jornada han finalizado.</div>
              <button onClick={() => setFechaSel(siguienteJornada)} style={{ marginTop:16, padding:'10px 24px', background:'#8dc63f', border:'none', borderRadius:8, fontFamily:"'Oswald',sans-serif", fontSize:13, fontWeight:700, color:'#0a0d14', cursor:'pointer' }}>
                Ver siguiente jornada →
              </button>
            </div>
          ) : partidosDelDia.length === 0 ? (
            <div className={styles.emptyState}>
              <Calendar size={40} style={{ margin:'0 auto', opacity:0.3, display:'block' }}/>
              <div className={styles.emptyTitle}>No hay partidos hoy</div>
              <div className={styles.emptyDesc}>Vuelve mañana para predecir los partidos del día.</div>
            </div>
          ) : (
            <div className={styles.partidosList}>
              {partidosDelDia.map((partido, idx) => {
                const badge = getEstadoBadge(partido);
                const { puede, razon } = puedePredecirsе(partido);

                return (
                  <motion.div key={partido.id}
                    className={`${styles.partidoCard} ${partido.predicho ? styles.predicho : ''} ${partido.estado === 'EN_VIVO' ? styles.enVivo : ''} ${!puede && !partido.predicho ? styles.bloqueado : ''}`}
                    initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:idx * 0.05 }}>

                    <div className={styles.partidoHeader}>
                      <div className={styles.partidoHora}><Clock size={13} style={{ color:'#8dc63f' }}/>{formatHora(partido.hora_inicio)}</div>
                      <div className={styles.partidoMeta}>
                        <span className={styles.partidoMetaItem}><MapPin size={11}/>{partido.ciudad}</span>
                        <span style={{ color:'rgba(255,255,255,0.12)' }}>·</span>
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>{partido.estadio}</span>
                      </div>
                      <span className={`${styles.partidoEstado} ${badge.clase}`}>{badge.texto}</span>
                    </div>

                    <div className={styles.partidoEquipos}>
                      <div className={styles.equipoLocal}>
                        <img src={`https://flagcdn.com/w160/${partido.flag_local}.png`} className={styles.flagImg} alt={partido.equipo_local} onError={e => (e.currentTarget.style.display = 'none')} />
                        <span className={styles.equipoNombre}>{partido.equipo_local}</span>
                        <span className={styles.equipoSub}>LOCAL</span>
                      </div>

                      <div className={styles.vsBox}>
                        {partido.estado === 'FINALIZADO' && partido.resultado_local !== undefined ? (
                          <div className={styles.vsScore}>{partido.resultado_local}<span> - </span>{partido.resultado_visitante}</div>
                        ) : (
                          <div className={styles.vsText}>VS</div>
                        )}
                      </div>

                      <div className={styles.equipoVisita}>
                        <img src={`https://flagcdn.com/w160/${partido.flag_visitante}.png`} className={styles.flagImg} alt={partido.equipo_visitante} onError={e => (e.currentTarget.style.display = 'none')} />
                        <span className={styles.equipoNombre}>{partido.equipo_visitante}</span>
                        <span className={styles.equipoSub}>VISITANTE</span>
                      </div>
                    </div>

                    {partido.apuestas_activas && apuestaPartido?.startsWith(partido.id) && (
                      <div style={{ margin:'0 18px 14px', background:'#111827', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, overflow:'hidden', position: 'relative', zIndex: 2 }}>
                        <div style={{ padding:'8px 14px', background:'rgba(255,255,255,.03)', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <span style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:700,color:'rgba(255,255,255,.5)',letterSpacing:1}}>
                            APUESTA — {apuestaPartido.split('-').pop() === '1' ? partido.equipo_local.toUpperCase() : apuestaPartido.split('-').pop() === '2' ? partido.equipo_visitante.toUpperCase() : 'EMPATE'}
                          </span>
                          <span style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:'#8dc63f'}}>
                            {apuestaPartido.split('-').pop() === '1' ? partido.cuota_1 : apuestaPartido.split('-').pop() === 'X' ? partido.cuota_x : partido.cuota_2}x
                          </span>
                        </div>
                        <div style={{padding:'12px 14px'}}>
                          <div style={{display:'flex',gap:6,marginBottom:10}}>
                            {[10,50,100,500].map(m => (
                              <button key={m} onClick={() => setMontoApuesta(String(m))} style={{ flex:1, padding:'6px 0', border:`1px solid ${montoApuesta===String(m)?'rgba(255,255,255,.25)':'rgba(255,255,255,.06)'}`, borderRadius:5, background: montoApuesta===String(m)?'rgba(255,255,255,.08)':'rgba(255,255,255,.02)', color: montoApuesta===String(m)?'#fff':'rgba(255,255,255,.3)', fontFamily:"'Oswald',sans-serif", fontSize:11, fontWeight:700, cursor:'pointer' }}>{m}</button>
                            ))}
                          </div>
                          <div style={{display:'flex',gap:8,marginBottom:10}}>
                            <input type="number" min={1} value={montoApuesta} onChange={e => setMontoApuesta(e.target.value)} placeholder="PX a apostar" style={{ flex:1, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:6, padding:'9px 12px', color:'#fff', fontSize:13, outline:'none', fontFamily:"'Roboto',sans-serif" }} />
                            <button onClick={() => hacerApuesta(partido, apuestaPartido.split('-').pop() as '1'|'X'|'2')} disabled={!montoApuesta || procesandoApuesta} style={{ padding:'9px 20px', background: montoApuesta ? '#8dc63f' : 'rgba(255,255,255,.04)', border:'none', borderRadius:6, fontFamily:"'Oswald',sans-serif", fontSize:12, fontWeight:700, color: montoApuesta ? '#0a0d14' : 'rgba(255,255,255,.2)', cursor: montoApuesta ? 'pointer' : 'not-allowed', transition:'all .15s' }}>
                              {procesandoApuesta ? '...' : 'APOSTAR'}
                            </button>
                          </div>
                          {montoApuesta && parseInt(montoApuesta) > 0 && (
                            <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.05)', borderRadius:6, fontSize:11 }}>
                              <span style={{color:'rgba(255,255,255,.3)'}}>Ganancia potencial</span>
                              <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,color:'#fff'}}>
                                {Math.floor(parseInt(montoApuesta) * Number( apuestaPartido.split('-').pop() === '1' ? (partido.cuota_1 || 1) : apuestaPartido.split('-').pop() === 'X' ? (partido.cuota_x || 1) : (partido.cuota_2 || 1) ))} PX
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {partido.predicho && partido.predicciones_jugador && (
                      <div style={{ padding:'0 18px 12px', position: 'relative', zIndex: 1 }}>
                        {partido.predicciones_jugador.map((r, i) => (
                          <div key={i} className={styles.resumenItem}>
                            <span className={styles.resumenPregunta}>{r.pregunta}</span>
                            <span className={styles.resumenRespuesta}>{r.respuesta}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={styles.partidoFooter}>
                      {partido.predicho ? (
                        <div className={`${styles.btnPredicho}`} style={{ background: partido.es_correcta === true ? 'rgba(141,198,63,.12)' : partido.es_correcta === false ? 'rgba(239,68,68,.12)' : 'rgba(141,198,63,.08)', borderColor: partido.es_correcta === true ? 'rgba(141,198,63,.3)' : partido.es_correcta === false ? 'rgba(239,68,68,.3)' : 'rgba(141,198,63,.2)', color: partido.es_correcta === true ? '#8dc63f' : partido.es_correcta === false ? '#ef4444' : '#8dc63f' }}>
                          {partido.es_correcta === true ? <><CheckCircle size={15}/> ¡Predicción correcta!</> : partido.es_correcta === false ? <><X size={15}/> Predicción incorrecta</> : <><CheckCircle size={15}/> Predicción enviada</>}
                        </div>
                      ) : partido.estado === 'EN_VIVO' ? (
                        <div className={styles.btnEnVivo}>● Partido en vivo — predicción cerrada</div>
                      ) : partido.estado === 'FINALIZADO' ? (
                        <div className={styles.btnPredicho}>Partido finalizado</div>
                      ) : !puede && razon === 'muy_pronto' ? (
                        <div className={styles.btnBloqueado}><Lock size={13}/> Disponible 24h antes del partido</div>
                      ) : !puede && razon === 'cerrado' ? (
                        <div className={styles.btnEnVivo}>Predicción cerrada</div>
                      ) : estaInscrito ? (
                        <button className={styles.btnPredecir} onClick={() => abrirPrediccion(partido)}><ChevronRight size={16}/> Predecir este partido</button>
                      ) : (
                        <button className={styles.btnBloqueado} onClick={() => router.push('/torneos')}><Lock size={13}/> Inscríbete para predecir</button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* PARTIDOS FINALIZADOS */}
          {partidosFinalizados.length > 0 && (
            <div style={{marginTop:24}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:600,color:"rgba(255,255,255,.3)",letterSpacing:2,textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:3,height:13,background:"rgba(56,189,248,.5)",borderRadius:2}}/> PARTIDOS FINALIZADOS
              </div>
              {partidosFinalizados.map((partido, idx) => (
                <motion.div key={partido.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.2,delay:idx*0.04}} style={{background:'#111827',border:`1px solid ${resultados[partido.id]===true?'rgba(141,198,63,.25)':resultados[partido.id]===false?'rgba(239,68,68,.2)':'rgba(255,255,255,.06)'}`,borderRadius:10,marginBottom:8,padding:'10px 14px',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' as const,opacity:0.8}}>
                  <span style={{fontFamily:"'Oswald',sans-serif",fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:3,background:'rgba(56,189,248,.12)',color:'#38bdf8'}}>FINALIZADO</span>
                  <span style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,color:'#fff',flex:1}}>{partido.equipo_local} vs {partido.equipo_visitante}</span>
                  {partido.resultado_local !== undefined && <span style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:'#fff'}}>{partido.resultado_local} — {partido.resultado_visitante}</span>}
                  {resultados[partido.id]===true && <span style={{fontFamily:"'Oswald',sans-serif",fontSize:10,fontWeight:700,color:'#8dc63f',background:'rgba(141,198,63,.1)',padding:'2px 8px',borderRadius:4}}>✓ ACERTASTE</span>}
                  {resultados[partido.id]===false && <span style={{fontFamily:"'Oswald',sans-serif",fontSize:10,fontWeight:700,color:'#ef4444',background:'rgba(239,68,68,.1)',padding:'2px 8px',borderRadius:4}}>✗ FALLASTE</span>}
                  {resultados[partido.id]===undefined && <span style={{fontFamily:"'Oswald',sans-serif",fontSize:10,color:'rgba(255,255,255,.25)'}}>Sin predicción</span>}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── COLUMNA 3: TICKET DE APUESTAS Y RECOMENDADOS ── */}
      <aside className={styles.rightSidebar}>
        
        {/* TICKET DE APUESTAS */}
        <div className={styles.ticketWrapper}>
          <div className={styles.ticketHeader}>
            <span>Ticket de Apuestas</span>
            <span style={{color: 'rgba(255,255,255,0.3)', fontSize: 11}}>0</span>
          </div>
          <div className={styles.ticketTabs}>
            <div className={`${styles.ticketTab} ${styles.active}`}>Sencilla</div>
            <div className={styles.ticketTab}>Múltiple</div>
            <div className={styles.ticketTab}>Sistema</div>
          </div>
          <div className={styles.ticketBody}>
            <div className={styles.ticketEmpty}>
              No has seleccionado ninguna cuota.<br/>
              Haz clic en las cuotas de los partidos para añadirlas a tu ticket.
            </div>
          </div>
        </div>

       {/* RECOMENDADOS */}
<div className={styles.recTitle}>Recomendados</div>
<div className={styles.recGrid}>
  <div className={styles.recCard}>
    <img src="/img/kick1.jpg" alt="Rec 1" />
  </div>
  <div className={styles.recCard}>
    <img src="/img/kick50.jpg" alt="Rec 2" />
  </div>
  <div className={styles.recCard}>
    <img src="/img/kick1.jpg" alt="Rec 3" />
  </div>
  <div className={styles.recCard}>
    <img src="/img/kick1.jpg" alt="Rec 4" />
  </div>
</div>

{/* IMAGEN GRANDE INFERIOR */}
<div style={{
  marginTop: 12,
  borderRadius: 10,
  overflow: 'hidden',
  border: '1px solid rgba(141,198,63,0.15)',
  cursor: 'pointer',
  position: 'relative',
  flex: 1,
  minHeight: 120,
}}>
  <img src="/img/kick55.png" alt="Promo" style={{
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
    opacity: 0.75, transition: '0.3s',
  }} />
  <div style={{
    position: 'absolute', inset: 0,
    background: 'linear-gradient(0deg, rgba(0,0,0,.75) 0%, transparent 60%)',
  }} />
  <div style={{
    position: 'absolute', bottom: 12, left: 14, right: 14,
  }}>
    <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 13, fontWeight: 700, color: '#fff' }}>
      MUNDIAL FIFA 2026
    </div>
    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
      64 partidos · 32 equipos
    </div>
  </div>
</div>
      </aside>

      {/* ══ MODAL DE PREDICCIÓN ══ */}
      <AnimatePresence>
        {fase === 'prediciendo' && partidoActivo && (
          <motion.div className={styles.modalOverlay} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div className={styles.modal} initial={{ opacity:0, y:60 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:40 }} transition={{ type:'spring', stiffness:300, damping:28 }}>
              <div className={styles.modalHeader}>
                <div className={styles.modalPartido}>
                  <div className={styles.modalEquipos}>{partidoActivo.equipo_local}<span>VS</span>{partidoActivo.equipo_visitante}</div>
                  <button className={styles.modalClose} onClick={() => setFase('lista')}>✕</button>
                </div>
                <div className={styles.modalMeta}>
                  <span className={styles.modalMetaItem}><Clock size={11}/>{formatHora(partidoActivo.hora_inicio)}</span><span>·</span>
                  <span className={styles.modalMetaItem}><MapPin size={11}/>{partidoActivo.estadio}</span><span>·</span><span>{partidoActivo.ciudad}</span>
                </div>
              </div>

              {cargandoPreguntas ? (
                <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, padding:40 }}>
                  <Activity size={30} style={{ color:'#8dc63f', animation:'spin 0.8s linear infinite' }}/>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontFamily:"'Oswald',sans-serif", letterSpacing:2 }}>CARGANDO PREGUNTAS...</span>
                </div>
              ) : preguntasActivas.length > 0 ? (
                <>
                  <div className={styles.modalProgreso}>
                    <span className={styles.modalProgresoLbl}>Pregunta</span>
                    <div className={styles.modalProgresoBar}>
                      {preguntasActivas.map((_, i) => (
                        <div key={i} className={`${styles.modalProgresoSeg} ${i < preguntaIdx ? styles.segHecho : i === preguntaIdx ? styles.segActivo : styles.segVacio}`}/>
                      ))}
                    </div>
                    <span className={styles.modalProgresoNum}>{preguntaIdx + 1} / {preguntasActivas.length}</span>
                  </div>

                  <div className={styles.cronRow}>
                    <div className={styles.cronDisplay}>
                      <span className={styles.cronTime} style={{ color:cronColor }}>{pad(mins)}:{pad(secs)}</span>
                      <span className={styles.cronLbl} style={{ color:cronColor }}>{!cronActivo ? '⏸ PAUSADO' : tiempoLeft <= 30 ? '⚠ CRÍTICO' : 'TIEMPO'}</span>
                    </div>
                    <div className={styles.cronBarWrap}><div className={styles.cronBarFill} style={{ width:`${pctCron*100}%`, background:cronColor }}/></div>
                    {!cronActivo && <button className={styles.btnActivar} onClick={() => setCronActivo(true)}>▶ Estoy listo</button>}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div key={`preg-${preguntaIdx}`} className={styles.preguntaWrap} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.22 }}>
                      <div className={styles.preguntaCat}>{preguntasActivas[preguntaIdx]?.categoria}</div>
                      <div className={styles.preguntaTexto}>{preguntasActivas[preguntaIdx]?.texto}</div>
                      <div className={styles.opcionesGrid}>
                        {(preguntasActivas[preguntaIdx]?.opciones || []).map((op, i) => {
                          const letras = ['A','B','C','D','E','F'];
                          const isSel  = seleccion === op.id;
                          return (
                            <motion.button key={op.id} className={`${styles.opcionBtn} ${isSel ? styles.seleccionada : ''}`} onClick={() => { if (!confirmando) setSeleccion(op.id); }} disabled={confirmando} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i * 0.05 }} whileHover={!confirmando ? { scale:1.01 } : {}} whileTap={!confirmando  ? { scale:0.99 } : {}}>
                              <div className={styles.opcionLetra}>{letras[i] || String(i+1)}</div>
                              <span className={styles.opcionTexto}>{op.texto}</span>
                              {op.cuota && <span className={styles.opcionCuota}>{op.cuota}</span>}
                              {isSel && <motion.div className={styles.opcionCheck} initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:400 }}>✓</motion.div>}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className={styles.modalFooter}>
                    <button className={styles.btnConfirmar} onClick={confirmarOpcion} disabled={!seleccion || confirmando || !cronActivo}>
                      {confirmando ? 'Guardando...' : preguntaIdx < preguntasActivas.length - 1 ? <><CheckCircle size={16}/> Confirmar y siguiente</> : <><Trophy size={16}/> Sellar predicción</>}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32, color:'rgba(255,255,255,0.3)', fontSize:12 }}>Preparando preguntas...</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}