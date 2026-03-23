'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHARACTER_CLASSES, LeaderboardEntry } from '@/lib/game-data';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dataSource, setDataSource] = useState<'loading' | 'server' | 'local'>('loading');

  useEffect(() => {
    async function loadLeaderboard() {
      // 尝试从服务器获取
      try {
        const response = await fetch('/api/leaderboard');
        const result = await response.json();
        
        if (result.useLocalStorage) {
          // 服务器未配置，使用本地存储
          loadFromLocalStorage();
          setDataSource('local');
        } else if (result.data) {
          // 从服务器获取成功
          const serverData = result.data.map((item: Record<string, unknown>) => ({
            name: item.player_name as string,
            classId: item.class_id as string,
            level: item.level as number,
            totalKills: item.total_kills as number,
            gold: item.gold as number,
            timestamp: new Date(item.created_at as string).getTime(),
          }));
          setLeaderboard(serverData);
          setDataSource('server');
        }
      } catch {
        // 网络错误，使用本地存储
        loadFromLocalStorage();
        setDataSource('local');
      }
    }

    function loadFromLocalStorage() {
      const saved = localStorage.getItem('rpg_leaderboard');
      if (saved) {
        const data = JSON.parse(saved);
        data.sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
          if (b.level !== a.level) return b.level - a.level;
          return b.totalKills - a.totalKills;
        });
        setLeaderboard(data.slice(0, 50));
      }
    }

    loadLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-[#d4d4d4] font-mono">
      {/* 标题栏 */}
      <div className="h-8 bg-[#323233] flex items-center px-4 text-xs text-[#858585] border-b border-[#3c3c3c]">
        <div className="flex gap-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-[#f14c4c]"></div>
          <div className="w-3 h-3 rounded-full bg-[#dcdcaa]"></div>
          <div className="w-3 h-3 rounded-full bg-[#4ec9b0]"></div>
        </div>
        <span className="flex-1 text-center">leaderboard.js - 挂机RPG - Visual Studio Code</span>
      </div>

      {/* 主内容 */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* 标题 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-[#569cd6]">const</span>{' '}
              <span className="text-[#9cdcfe]">排行榜</span>{' '}
              <span className="text-[#d4d4d4]">=</span>{' '}
              <span className="text-[#dcdcaa]">"荣耀殿堂"</span>;
            </h1>
            <p className="text-[#6a9955]">
              {dataSource === 'server' && '// 云端排行榜 - 所有玩家共享'}
              {dataSource === 'local' && '// 本地排行榜 - 仅本机可见'}
              {dataSource === 'loading' && '// 加载中...'}
            </p>
          </div>

          {/* 排行榜卡片 */}
          <Card className="bg-[#252526] border-[#3c3c3c]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[#dcdcaa] flex items-center gap-2">
                🏆 英雄榜
                {dataSource === 'server' && (
                  <span className="text-xs text-[#4ec9b0] ml-2">● 在线</span>
                )}
                {dataSource === 'local' && (
                  <span className="text-xs text-[#dcdcaa] ml-2">● 本地</span>
                )}
              </CardTitle>
              <Link href="/">
                <Button variant="outline" className="border-[#3c3c3c] text-[#d4d4d4] hover:bg-[#3c3c3c]">
                  返回首页
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12 text-[#858585]">
                  <div className="text-4xl mb-4">🎮</div>
                  <div>暂无数据，快去创造你的传奇吧！</div>
                  <Link href="/">
                    <Button className="mt-4 bg-[#569cd6] hover:bg-[#4a8cd4]">
                      开始游戏
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* 表头 */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-[#858585] border-b border-[#3c3c3c]">
                    <div className="col-span-1">排名</div>
                    <div className="col-span-3">角色</div>
                    <div className="col-span-2">职业</div>
                    <div className="col-span-2">等级</div>
                    <div className="col-span-2">击杀</div>
                    <div className="col-span-2">金币</div>
                  </div>
                  
                  {/* 排行数据 */}
                  {leaderboard.map((entry, index) => {
                    const cls = CHARACTER_CLASSES.find(c => c.id === entry.classId) || CHARACTER_CLASSES[0];
                    const rankColor = 
                      index === 0 ? 'text-[#dcdcaa]' :
                      index === 1 ? 'text-[#c0c0c0]' :
                      index === 2 ? 'text-[#cd7f32]' :
                      'text-[#d4d4d4]';
                    const rankBg = 
                      index === 0 ? 'bg-[#dcdcaa]/10' :
                      index === 1 ? 'bg-[#c0c0c0]/10' :
                      index === 2 ? 'bg-[#cd7f32]/10' :
                      '';
                    
                    return (
                      <div 
                        key={entry.timestamp || index}
                        className={`grid grid-cols-12 gap-2 px-4 py-3 rounded ${rankBg} hover:bg-[#3c3c3c]/50 transition-colors`}
                      >
                        <div className={`col-span-1 font-bold ${rankColor}`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                        </div>
                        <div className="col-span-3 text-[#9cdcfe]">{entry.name}</div>
                        <div className="col-span-2 text-[#ce9178]">{cls.emoji} {cls.name}</div>
                        <div className="col-span-2 text-[#b5cea8]">{entry.level}级</div>
                        <div className="col-span-2 text-[#f14c4c]">{entry.totalKills}</div>
                        <div className="col-span-2 text-[#dcdcaa]">{entry.gold.toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 说明 */}
          <div className="mt-6 text-center text-[#858585] text-sm space-y-2">
            <p>点击游戏中的"提交排行榜"按钮将你的成绩加入排行</p>
            {dataSource === 'local' && (
              <p className="text-[#dcdcaa]">💡 配置 Supabase 可实现云端排行榜，详见 README.md</p>
            )}
          </div>

          {/* 分享提示 */}
          <div className="mt-4 text-center text-[#6a9955] text-sm">
            <p>// 分享链接给朋友：{typeof window !== 'undefined' ? window.location.origin : ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
