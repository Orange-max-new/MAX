import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// 获取排行榜
export async function GET() {
  // 如果没有配置 Supabase，返回提示
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ 
      error: 'Supabase 未配置',
      hint: '请设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 环境变量',
      useLocalStorage: true 
    });
  }

  try {
    const { data, error } = await supabase!
      .from('leaderboard')
      .select('*')
      .order('level', { ascending: false })
      .order('total_kills', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 提交到排行榜
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ 
      error: 'Supabase 未配置',
      useLocalStorage: true 
    });
  }

  try {
    const body = await request.json();
    const { playerName, classId, level, totalKills, gold } = body;

    if (!playerName || !classId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const { error } = await supabase!
      .from('leaderboard')
      .insert([{
        player_name: playerName,
        class_id: classId,
        level: level || 1,
        total_kills: totalKills || 0,
        gold: gold || 0,
      }]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '提交成功' });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
