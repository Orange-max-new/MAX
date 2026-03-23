'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CHARACTER_CLASSES, LeaderboardEntry } from '@/lib/game-data';

export default function HomePage() {
  const [playerName, setPlayerName] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleStartGame = () => {
    if (!playerName.trim()) {
      setError('请输入角色名称');
      return;
    }
    if (!selectedClass) {
      setError('请选择一个职业');
      return;
    }
    
    // 保存角色信息到 localStorage
    const playerData = {
      name: playerName.trim(),
      classId: selectedClass,
    };
    localStorage.setItem('rpg_player_data', JSON.stringify(playerData));
    
    // 跳转到游戏页面
    window.location.href = '/game';
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-[#d4d4d4] font-mono">
      {/* 标题栏 */}
      <div className="h-8 bg-[#323233] flex items-center px-4 text-xs text-[#858585] border-b border-[#3c3c3c]">
        <div className="flex gap-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-[#f14c4c]"></div>
          <div className="w-3 h-3 rounded-full bg-[#dcdcaa]"></div>
          <div className="w-3 h-3 rounded-full bg-[#4ec9b0]"></div>
        </div>
        <span className="flex-1 text-center">挂机RPG - Visual Studio Code</span>
      </div>

      {/* 主内容 */}
      <div className="flex flex-col items-center justify-center p-8">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-[#569cd6]">const</span>{' '}
            <span className="text-[#9cdcfe]">游戏</span>{' '}
            <span className="text-[#d4d4d4]">=</span>{' '}
            <span className="text-[#ce9178]">"摸鱼神器"</span>;
          </h1>
          <p className="text-[#6a9955]">// 伪装成代码编辑器的RPG游戏，上班摸鱼必备</p>
        </div>

        {/* 角色创建卡片 */}
        <Card className="w-full max-w-2xl bg-[#252526] border-[#3c3c3c]">
          <CardHeader>
            <CardTitle className="text-[#dcdcaa]">创建角色</CardTitle>
            <CardDescription className="text-[#858585]">
              输入名称并选择职业开始冒险
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 名称输入 */}
            <div>
              <label className="block text-sm text-[#9cdcfe] mb-2">角色名称</label>
              <Input
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setError('');
                }}
                placeholder="输入你的角色名称..."
                className="bg-[#1e1e1e] border-[#3c3c3c] text-[#d4d4d4] focus:border-[#569cd6]"
                maxLength={12}
              />
            </div>

            {/* 职业选择 */}
            <div>
              <label className="block text-sm text-[#9cdcfe] mb-2">选择职业</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CHARACTER_CLASSES.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => {
                      setSelectedClass(cls.id);
                      setError('');
                    }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedClass === cls.id
                        ? 'border-[#569cd6] bg-[#1e1e1e]'
                        : 'border-[#3c3c3c] bg-[#1e1e1e] hover:border-[#569cd6]/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{cls.emoji}</div>
                    <div className="text-[#dcdcaa] font-bold">{cls.name}</div>
                    <div className="text-xs text-[#858585] mt-1">{cls.desc}</div>
                    <div className="mt-3 text-xs space-y-1">
                      <div className="text-[#f14c4c]">♥ {cls.baseHp}</div>
                      <div className="text-[#4299e1]">◆ {cls.baseMp}</div>
                      <div className="text-[#dcdcaa]">⚔ {cls.baseAtk}</div>
                      <div className="text-[#4ec9b0]">🛡 {cls.baseDef}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="text-[#f14c4c] text-sm">{error}</div>
            )}
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button
              onClick={handleStartGame}
              className="flex-1 bg-[#569cd6] hover:bg-[#4a8cd4] text-white"
            >
              开始游戏
            </Button>
            <Link href="/leaderboard" className="flex-1">
              <Button variant="outline" className="w-full border-[#3c3c3c] text-[#d4d4d4] hover:bg-[#3c3c3c]">
                🏆 排行榜
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* 游戏说明 */}
        <div className="mt-8 max-w-2xl w-full">
          <Card className="bg-[#252526] border-[#3c3c3c]">
            <CardHeader>
              <CardTitle className="text-[#dcdcaa] text-lg">游戏说明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-[#858585]">
              <p><span className="text-[#6a9955]">//</span> 点击"寻找敌人"开始战斗</p>
              <p><span className="text-[#6a9955]">//</span> 使用技能攻击敌人，注意魔力消耗</p>
              <p><span className="text-[#6a9955]">//</span> 装备从背包手动穿戴，点击已装备可卸下</p>
              <p><span className="text-[#6a9955]">//</span> 敌人可能会逃跑，也可能击败你</p>
              <p><span className="text-[#6a9955]">//</span> 界面伪装成VSCode，适合上班摸鱼</p>
            </CardContent>
          </Card>
        </div>

        {/* 分享链接提示 */}
        <div className="mt-4 text-center text-[#858585] text-sm">
          <p>分享链接给朋友一起玩：{typeof window !== 'undefined' ? window.location.origin : ''}</p>
        </div>
      </div>
    </div>
  );
}
