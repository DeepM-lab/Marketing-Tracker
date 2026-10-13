import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return NextResponse.json({
        status: 'ok',
        message: 'Ping endpoint ready (Waiting for real Supabase credentials)',
        timestamp: new Date().toISOString(),
      });
    }

    const supabase = await createClient();
    // Query siêu nhẹ để Supabase biết database đang active
    const { data, error } = await supabase.from('profiles').select('id').limit(1);

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { status: 'warning', error: error.message, timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Supabase database is alive and active!',
      timestamp: new Date().toISOString(),
      dataCount: data ? data.length : 0,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { status: 'error', error: error.message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
