import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorias = searchParams.get('categorias')?.split(',') || ['resultado'];
  const limite = parseInt(searchParams.get('limite') || '10');

  const { data, error } = await supabase
    .from('banco_preguntas')
    .select('id, categoria, pregunta, opciones_pregunta(id, texto)')
    .in('categoria', categorias)
    .eq('activa', true)
    .limit(limite);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}