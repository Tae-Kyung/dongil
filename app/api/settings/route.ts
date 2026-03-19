import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { data } = await supabase
    .from('app_settings')
    .select('setting_key, value')
    .eq('setting_key', 'chat_system_prompt')
    .single();

  return NextResponse.json({ value: data?.value ?? null });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { value } = await request.json();
  if (typeof value !== 'string' || !value.trim()) {
    return NextResponse.json({ error: '유효하지 않은 값입니다.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('app_settings')
    .upsert({ setting_key: 'chat_system_prompt', value: value.trim(), updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
