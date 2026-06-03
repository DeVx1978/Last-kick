// app/api/juego/unirse/route.ts
// FASE 9 — Lógica de descuento PX al unirse a un EventoJuego

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.devxsolutions.pro';

async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set() {},
        remove() {},
      },
    }
  );
}

// POST /api/juego/unirse
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { evento_juego_id } = body as { evento_juego_id: string };

    if (!evento_juego_id) {
      return NextResponse.json({ error: 'evento_juego_id requerido' }, { status: 400 });
    }

    const supabase = await createSupabaseServer();

    // 1. Verificar sesión
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userId = user.id;
    const bearerToken = (await supabase.auth.getSession()).data.session?.access_token ?? '';

    // INTENTO 1: Backend NestJS
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const backendRes = await fetch(`${API_URL}/eventos/${evento_juego_id}/unirse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`,
        },
        body: JSON.stringify({ evento_juego_id }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json({
          ok: true,
          source: 'backend',
          jugador_evento: data.jugador_evento ?? data,
          mensaje: data.mensaje ?? 'Te has unido al evento correctamente',
        });
      }

      if (backendRes.status !== 404 && backendRes.status !== 500) {
        const err = await backendRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: err.message ?? 'Error al unirse al evento' },
          { status: backendRes.status }
        );
      }
    } catch {
      // timeout o red caída → fallback Supabase
    }

    // FALLBACK: Supabase directo

    // 2. Datos del evento
    const { data: evento, error: eventoError } = await supabase
      .from('tournaments')
      .select('id, name, status, costo_px, vidas_base, vidas_bonus, bonus_activo, bonus_px')
      .eq('id', evento_juego_id)
      .maybeSingle();


    if (eventoError || !evento) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    if (evento.status !== 'ACTIVO') {
      return NextResponse.json({ error: 'El evento no está activo' }, { status: 409 });
    }

    // 3. Saldo del jugador

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, pitchx_balance, status')
      .eq('id', userId)
      .maybeSingle();


    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    if (profile.status === 'BLOQUEADO') {
      return NextResponse.json({ error: 'Tu cuenta está bloqueada' }, { status: 403 });
    }

    const costoPx = evento.costo_px ?? 0;
    const saldo   = profile.pitchx_balance ?? 0;


    if (saldo < costoPx) {
      return NextResponse.json({
        error: 'Saldo insuficiente',
        saldo_actual: saldo,
        costo_requerido: costoPx,
        falta: costoPx - saldo,
      }, { status: 402 });
    }

    // 4. Verificar si ya está inscrito
    const { data: yaInscrito } = await supabase
      .from('tournament_entries')
      .select('id, vidas, status')
      .eq('user_id', userId)
      .eq('tournament_id', evento_juego_id)
      .maybeSingle();

    if (yaInscrito) {
      return NextResponse.json({
        ok: true,
        source: 'fallback',
        ya_inscrito: true,
        jugador_evento: yaInscrito,
        mensaje: 'Ya estás inscrito en este evento',
      });
    }

    // 5. Calcular vidas totales
    const vidasBase  = evento.vidas_base ?? costoPx;
    const vidasBonus = evento.bonus_activo ? (evento.bonus_px ?? 0) : (evento.vidas_bonus ?? 0);
    const vidasTotal = vidasBase + vidasBonus;
    const nuevoSaldo = saldo - costoPx;


    // 6a. Descontar PX
    const { error: updateSaldoError } = await supabase
      .from('profiles')
      .update({ pitchx_balance: nuevoSaldo })
      .eq('id', userId);


    if (updateSaldoError) {
      return NextResponse.json({ error: 'Error al descontar saldo' }, { status: 500 });
    }

    // 6b. Crear entrada en tournament_entries
    const { data: entrada, error: entradaError } = await supabase
      .from('tournament_entries')
      .insert({
        user_id:          userId,
        tournament_id:    evento_juego_id,
        vidas:            vidasTotal,
        vidas_iniciales:  vidasTotal,
        status:           'ACTIVO',
        racha_actual:     0,
        racha_maxima:     0,
        nivel_ingreso:    1,
        partidos_jugados: 0,
        aciertos_totales: 0,
        fecha_ingreso:    new Date().toISOString(),
      })
      .select()
      .single();


    if (entradaError) {
      await supabase
        .from('profiles')
        .update({ pitchx_balance: saldo })
        .eq('id', userId);
      return NextResponse.json({ error: 'Error al crear entrada al evento' }, { status: 500 });
    }

    // 6c. Registrar movimiento en px_transactions
    supabase.from('px_transactions').insert({
      user_id:        userId,
      tipo:           'PAGO_EVENTO',
      type:           'PAGO_EVENTO',
      monto:          -costoPx,
      amount:         -costoPx,
      descripcion:    `Entrada a: ${evento.name}`,
      description:    `Entrada a: ${evento.name}`,
      referencia_id:  evento_juego_id,
      reference_id:   evento_juego_id,
      saldo_anterior: saldo,
      balance_before: saldo,
      saldo_nuevo:    nuevoSaldo,
      balance_after:  nuevoSaldo,
    }).then(() => {});

    return NextResponse.json({
      ok:              true,
      source:          'fallback',
      jugador_evento:  entrada,
      saldo_anterior:  saldo,
      saldo_nuevo:     nuevoSaldo,
      vidas_asignadas: vidasTotal,
      mensaje:         `¡Bienvenido a ${evento.name}! Tienes ${vidasTotal} vidas para jugar.`,
    });

  } catch (err) {
    console.error('[/api/juego/unirse] Error completo:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// GET /api/juego/unirse?evento_juego_id=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const evento_juego_id  = searchParams.get('evento_juego_id');

    if (!evento_juego_id) {
      return NextResponse.json({ error: 'evento_juego_id requerido' }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ inscrito: false });
    }

    // Intentar backend primero
    try {
      const bearerToken = (await supabase.auth.getSession()).data.session?.access_token ?? '';
      const backendRes = await fetch(`${API_URL}/juego/mi-estado/${evento_juego_id}`, {
        headers: { 'Authorization': `Bearer ${bearerToken}` },
      });
      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json({ inscrito: true, source: 'backend', estado: data });
      }
    } catch {}

    // Fallback Supabase
    const { data: entrada } = await supabase
      .from('tournament_entries')
      .select('id, vidas, status, racha_actual, racha_maxima, partidos_jugados, aciertos_totales, fecha_ingreso')
      .eq('user_id', user.id)
      .eq('tournament_id', evento_juego_id)
      .maybeSingle();

    if (!entrada) {
      return NextResponse.json({ inscrito: false });
    }

    return NextResponse.json({
      inscrito: true,
      source:   'fallback',
      estado: {
        vidas:            entrada.vidas,
        status:           entrada.status,
        racha_actual:     entrada.racha_actual,
        racha_maxima:     entrada.racha_maxima,
        partidos_jugados: entrada.partidos_jugados,
        aciertos_totales: entrada.aciertos_totales,
        fecha_ingreso:    entrada.fecha_ingreso,
      },
    });

  } catch (err) {
    console.error('[/api/juego/unirse GET] Error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
