'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MONSTERS,
  SKILLS,
  CHARACTER_CLASSES,
  EQUIPMENT_TYPES,
  EQUIPMENT_RARITIES,
  EQUIPMENT_NAMES,
  PlayerState,
  Enemy,
  Equipment,
} from '@/lib/game-data';

export default function GamePage() {
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [logs, setLogs] = useState<{ time: string; type: string; message: string }[]>([]);
  const [inBattle, setInBattle] = useState(false);

  // 初始化玩家
  useEffect(() => {
    const savedData = localStorage.getItem('rpg_player_data');
    if (savedData) {
      const data = JSON.parse(savedData);
      const cls = CHARACTER_CLASSES.find(c => c.id === data.classId) || CHARACTER_CLASSES[0];
      
      // 检查是否有保存的游戏状态
      const savedState = localStorage.getItem('rpg_game_state');
      if (savedState) {
        setPlayer(JSON.parse(savedState));
      } else {
        setPlayer({
          name: data.name,
          classId: data.classId,
          level: 1,
          exp: 0,
          expToNext: 100,
          hp: cls.baseHp,
          maxHp: cls.baseHp,
          mp: cls.baseMp,
          maxMp: cls.baseMp,
          baseAtk: cls.baseAtk,
          baseDef: cls.baseDef,
          critRate: cls.critRate,
          gold: 0,
          totalKills: 0,
          isDefending: false,
          equipment: {
            mainHand: null,
            body: null,
            accessory: null,
          },
          inventory: [],
          unlockedSkills: ['attack', 'heavyStrike', 'defend'],
          skillCooldowns: {},
        });
      }
    } else {
      window.location.href = '/';
    }
  }, []);

  // 自动保存
  useEffect(() => {
    if (player) {
      localStorage.setItem('rpg_game_state', JSON.stringify(player));
    }
  }, [player]);

  // MP自动恢复
  useEffect(() => {
    const interval = setInterval(() => {
      if (player && player.mp < player.maxMp) {
        setPlayer(prev => prev ? { ...prev, mp: Math.min(prev.maxMp, prev.mp + 1) } : null);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [player]);

  // 添加日志
  const addLog = useCallback((type: string, message: string) => {
    const now = new Date();
    const time = `[${now.toLocaleTimeString('zh-CN', { hour12: false })}]`;
    setLogs(prev => [{ time, type, message }, ...prev].slice(0, 100));
  }, []);

  // 获取玩家总属性
  const getPlayerAtk = useCallback(() => {
    if (!player) return 0;
    let atk = player.baseAtk;
    Object.values(player.equipment).forEach(equip => {
      if (equip) atk += equip.stats.atk || 0;
    });
    return Math.floor(atk);
  }, [player]);

  const getPlayerDef = useCallback(() => {
    if (!player) return 0;
    let def = player.baseDef;
    Object.values(player.equipment).forEach(equip => {
      if (equip) def += equip.stats.def || 0;
    });
    return Math.floor(def);
  }, [player]);

  const getCritRate = useCallback(() => {
    if (!player) return 0;
    let rate = player.critRate;
    Object.values(player.equipment).forEach(equip => {
      if (equip) rate += equip.stats.critRate || 0;
    });
    return Math.min(rate, 0.5);
  }, [player]);

  // 生成敌人
  const spawnEnemy = useCallback(() => {
    if (!player) return;
    
    const maxIndex = Math.min(Math.floor((player.level - 1) / 2), MONSTERS.length - 1);
    const minIndex = Math.max(0, maxIndex - 2);
    const monsterIndex = Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex;
    const baseMonster = MONSTERS[monsterIndex];
    
    const levelMultiplier = 1 + (player.level - 1) * 0.08;
    
    const newEnemy: Enemy = {
      name: baseMonster.name,
      emoji: baseMonster.emoji,
      maxHp: Math.floor(baseMonster.hp * levelMultiplier),
      hp: Math.floor(baseMonster.hp * levelMultiplier),
      atk: Math.floor(baseMonster.atk * levelMultiplier),
      def: Math.floor(baseMonster.def * levelMultiplier),
      exp: Math.floor(baseMonster.exp * levelMultiplier),
      gold: Math.floor(baseMonster.gold * levelMultiplier),
      fleeRate: baseMonster.fleeRate,
    };
    
    setEnemy(newEnemy);
    setInBattle(true);
    setPlayer(prev => prev ? { ...prev, isDefending: false, skillCooldowns: {} } : null);
    addLog('combat', `【遭遇】${newEnemy.emoji} ${newEnemy.name} 出现了！`);
    addLog('info', `【信息】生命: ${newEnemy.maxHp}，攻击: ${newEnemy.atk}，防御: ${newEnemy.def}`);
  }, [player, addLog]);

  // 使用技能
  const useSkill = useCallback((skillId: string) => {
    if (!player || !enemy || !inBattle) return;
    
    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) return;
    
    // 检查解锁
    if (!player.unlockedSkills.includes(skillId)) {
      addLog('error', `【错误】技能 ${skill.name} 尚未解锁`);
      return;
    }
    
    // 检查冷却
    if (player.skillCooldowns[skillId] > 0) {
      addLog('warning', `【冷却】${skill.name} 还需 ${player.skillCooldowns[skillId]} 回合`);
      return;
    }
    
    // 检查MP
    if (player.mp < skill.mpCost) {
      addLog('error', `【错误】魔力不足！需要 ${skill.mpCost} 魔力`);
      return;
    }
    
    // 消耗MP
    setPlayer(prev => {
      if (!prev) return null;
      return { ...prev, mp: prev.mp - skill.mpCost };
    });
    
    // 执行技能
    if (skill.type === 'damage') {
      const playerAtk = getPlayerAtk();
      const isCrit = Math.random() < getCritRate();
      
      let damage = Math.max(1, playerAtk * skill.value - enemy.def);
      if (isCrit) {
        damage = Math.floor(damage * 1.5);
        addLog('combat', `【暴击】使用 ${skill.icon} ${skill.name}！造成 ${damage} 点暴击伤害！`);
      } else {
        addLog('combat', `【攻击】使用 ${skill.icon} ${skill.name}，造成 ${damage} 点伤害`);
      }
      
      const newEnemyHp = enemy.hp - damage;
      setEnemy(prev => prev ? { ...prev, hp: newEnemyHp } : null);
      
      if (newEnemyHp <= 0) {
        // 敌人死亡
        setTimeout(() => defeatEnemy(enemy, newEnemyHp <= 0), 100);
      } else {
        // 敌人反击
        setTimeout(() => enemyTurn(newEnemyHp), 100);
      }
    } else if (skill.type === 'defend') {
      setPlayer(prev => prev ? { ...prev, isDefending: true } : null);
      addLog('success', `【防御】进入防御姿态，下次受到的伤害减少 50%`);
      setTimeout(() => enemyTurn(enemy.hp), 100);
    } else if (skill.type === 'heal') {
      const healAmount = Math.floor(player.maxHp * skill.value);
      setPlayer(prev => prev ? { 
        ...prev, 
        hp: Math.min(prev.maxHp, prev.hp + healAmount) 
      } : null);
      addLog('success', `【治疗】恢复了 ${healAmount} 点生命值`);
      setTimeout(() => enemyTurn(enemy.hp), 100);
    }
    
    // 设置冷却
    setPlayer(prev => {
      if (!prev) return null;
      const newCooldowns = { ...prev.skillCooldowns };
      newCooldowns[skillId] = skill.cooldown;
      // 减少其他技能冷却
      Object.keys(newCooldowns).forEach(key => {
        if (newCooldowns[key] > 0) newCooldowns[key]--;
      });
      return { ...prev, skillCooldowns: newCooldowns };
    });
  }, [player, enemy, inBattle, addLog, getPlayerAtk, getCritRate]);

  // 敌人回合
  const enemyTurn = useCallback((currentEnemyHp: number) => {
    if (!enemy || !player || currentEnemyHp <= 0) return;
    
    // 逃跑判定
    if (Math.random() < enemy.fleeRate) {
      addLog('warning', `【逃跑】${enemy.emoji} ${enemy.name} 逃跑了！`);
      setEnemy(null);
      setInBattle(false);
      return;
    }
    
    // 敌人攻击
    let enemyDamage = Math.max(1, enemy.atk - getPlayerDef());
    
    if (player.isDefending) {
      enemyDamage = Math.floor(enemyDamage * 0.5);
      addLog('info', `【防御】防御姿态减少了伤害`);
    }
    
    const newPlayerHp = player.hp - enemyDamage;
    addLog('error', `【受伤】受到 ${enemy.emoji} ${enemy.name} 的 ${enemyDamage} 点伤害`);
    
    if (newPlayerHp <= 0) {
      // 玩家死亡
      const lostGold = Math.floor(player.gold * 0.1);
      addLog('error', `【阵亡】你被 ${enemy.name} 击败了！`);
      addLog('error', `【损失】丢失了 ${lostGold} 金币`);
      
      setPlayer(prev => prev ? { 
        ...prev, 
        hp: 0,
        gold: prev.gold - lostGold,
        isDefending: false,
      } : null);
      setEnemy(null);
      setInBattle(false);
      
      // 3秒后复活
      setTimeout(() => {
        setPlayer(prev => prev ? { 
          ...prev, 
          hp: Math.floor(prev.maxHp * 0.5),
          mp: prev.maxMp,
        } : null);
        addLog('success', `【复活】你复活了！生命恢复至 50%`);
      }, 3000);
    } else {
      setPlayer(prev => prev ? { ...prev, hp: newPlayerHp, isDefending: false } : null);
    }
  }, [enemy, player, addLog, getPlayerDef]);

  // 击败敌人
  const defeatEnemy = useCallback((defeatedEnemy: Enemy | null, isDefeated: boolean) => {
    if (!isDefeated || !defeatedEnemy || !player) return;
    
    const expGain = defeatedEnemy.exp;
    const goldGain = defeatedEnemy.gold;
    
    addLog('success', `【胜利】${defeatedEnemy.emoji} ${defeatedEnemy.name} 被击败！`);
    addLog('loot', `【战利品】+${expGain} 经验，+${goldGain} 金币`);
    
    // 随机掉落装备
    if (Math.random() < 0.25) {
      dropEquipment();
    }
    
    let newExp = player.exp + expGain;
    let newLevel = player.level;
    let newExpToNext = player.expToNext;
    let newMaxHp = player.maxHp;
    let newMaxMp = player.maxMp;
    let newBaseAtk = player.baseAtk;
    let newBaseDef = player.baseDef;
    const newUnlockedSkills = [...player.unlockedSkills];
    
    // 升级检查
    while (newExp >= newExpToNext) {
      newLevel++;
      newExp -= newExpToNext;
      newExpToNext = Math.floor(newExpToNext * 1.4);
      newMaxHp += 25;
      newMaxMp += 10;
      newBaseAtk += 4;
      newBaseDef += 2;
      
      addLog('level', `【升级】等级提升至 ${newLevel}！`);
      addLog('success', `【属性】生命: ${newMaxHp}，魔力: ${newMaxMp}，攻击: ${newBaseAtk}，防御: ${newBaseDef}`);
      
      // 检查技能解锁
      SKILLS.forEach(skill => {
        if (skill.unlockLevel && newLevel >= skill.unlockLevel && !newUnlockedSkills.includes(skill.id)) {
          newUnlockedSkills.push(skill.id);
          addLog('warning', `【解锁】新技能 ${skill.icon} ${skill.name} 已解锁！`);
        }
      });
    }
    
    setPlayer(prev => prev ? {
      ...prev,
      exp: newExp,
      expToNext: newExpToNext,
      level: newLevel,
      maxHp: newMaxHp,
      hp: Math.min(prev.hp + 20, newMaxHp),
      maxMp: newMaxMp,
      mp: Math.min(prev.mp + 10, newMaxMp),
      baseAtk: newBaseAtk,
      baseDef: newBaseDef,
      gold: prev.gold + goldGain,
      totalKills: prev.totalKills + 1,
      unlockedSkills: newUnlockedSkills,
    } : null);
    
    setEnemy(null);
    setInBattle(false);
    addLog('info', `【提示】点击"寻找敌人"继续战斗`);
  }, [player, addLog]);

  // 掉落装备
  const dropEquipment = useCallback(() => {
    if (!player) return;
    
    const types = Object.keys(EQUIPMENT_TYPES) as (keyof typeof EQUIPMENT_TYPES)[];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // 随机品质
    const rand = Math.random();
    let rarityIndex = 0;
    if (rand < 0.5) rarityIndex = 0;      // 50% 普通
    else if (rand < 0.8) rarityIndex = 1; // 30% 稀有
    else if (rand < 0.95) rarityIndex = 2; // 15% 史诗
    else rarityIndex = 3;                  // 5% 传说
    
    const rarity = EQUIPMENT_RARITIES[rarityIndex];
    const nameIndex = Math.min(Math.floor(Math.random() * 6), 5);
    const baseName = EQUIPMENT_NAMES[type][nameIndex];
    
    const baseStat = 5 + player.level * 3;
    const stats: Equipment['stats'] = {};
    
    switch (type) {
      case 'weapon':
        stats.atk = Math.floor((baseStat + Math.floor(Math.random() * 11) + 5) * rarity.multiplier);
        if (Math.random() < 0.3) stats.critRate = Math.random() * 0.08 * rarity.multiplier;
        break;
      case 'armor':
        stats.def = Math.floor((baseStat * 0.7 + Math.floor(Math.random() * 8) + 3) * rarity.multiplier);
        stats.hp = Math.floor((Math.floor(Math.random() * 26) + 15) * rarity.multiplier);
        break;
      case 'accessory':
        stats.atk = Math.floor((Math.floor(Math.random() * 8) + 3) * rarity.multiplier);
        stats.def = Math.floor((Math.floor(Math.random() * 7) + 2) * rarity.multiplier);
        if (Math.random() < 0.4) stats.critRate = Math.random() * 0.05 * rarity.multiplier;
        break;
    }
    
    const equipment: Equipment = {
      id: Date.now() + Math.random(),
      type,
      name: `${rarity.name}${baseName}`,
      rarity: rarity.name,
      color: rarity.color,
      stats,
    };
    
    setPlayer(prev => {
      if (!prev) return null;
      return { ...prev, inventory: [...prev.inventory, equipment] };
    });
    
    addLog('loot', `【掉落】获得装备：${equipment.name}`);
    const statParts: string[] = [];
    if (stats.atk) statParts.push(`攻击+${stats.atk}`);
    if (stats.def) statParts.push(`防御+${stats.def}`);
    if (stats.hp) statParts.push(`生命+${stats.hp}`);
    if (stats.critRate) statParts.push(`暴击+${Math.floor(stats.critRate * 100)}%`);
    addLog('info', `【属性】${statParts.join('，')}`);
  }, [player, addLog]);

  // 穿戴装备
  const equipItem = useCallback((itemId: number) => {
    if (!player) return;
    
    const item = player.inventory.find(i => i.id === itemId);
    if (!item) return;
    
    const slot = EQUIPMENT_TYPES[item.type].slot;
    const currentEquip = player.equipment[slot];
    
    setPlayer(prev => {
      if (!prev) return null;
      const newInventory = prev.inventory.filter(i => i.id !== itemId);
      if (currentEquip) {
        newInventory.push(currentEquip);
      }
      return {
        ...prev,
        equipment: {
          ...prev.equipment,
          [slot]: item,
        },
        inventory: newInventory,
      };
    });
    
    addLog('success', `【装备】${item.name} 已穿戴！`);
  }, [player, addLog]);

  // 卸下装备
  const unequipItem = useCallback((slot: 'mainHand' | 'body' | 'accessory') => {
    if (!player) return;
    
    const item = player.equipment[slot];
    if (!item) return;
    
    setPlayer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        equipment: {
          ...prev.equipment,
          [slot]: null,
        },
        inventory: [...prev.inventory, item],
      };
    });
    
    addLog('info', `【卸下】${item.name} 已放入背包`);
  }, [player, addLog]);

  // 出售装备
  const sellItem = useCallback((itemId: number) => {
    if (!player) return;
    
    const item = player.inventory.find(i => i.id === itemId);
    if (!item) return;
    
    const rarityIndex = EQUIPMENT_RARITIES.findIndex(r => r.name === item.rarity);
    const sellPrice = Math.floor(20 * rarityIndex + 10);
    
    setPlayer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        gold: prev.gold + sellPrice,
        inventory: prev.inventory.filter(i => i.id !== itemId),
      };
    });
    
    addLog('loot', `【出售】${item.name} 卖出了 ${sellPrice} 金币`);
  }, [player, addLog]);

  // 强化属性
  const upgradeStat = useCallback((stat: 'atk' | 'def' | 'hp') => {
    if (!player) return;
    
    const costs = { atk: 80, def: 60, hp: 50 };
    const cost = Math.floor(costs[stat] * Math.pow(1.15, player.level));
    
    if (player.gold < cost) {
      addLog('error', `【错误】金币不足，需要 ${cost} 金币`);
      return;
    }
    
    setPlayer(prev => {
      if (!prev) return null;
      const updates: Partial<PlayerState> = { gold: prev.gold - cost };
      
      if (stat === 'atk') {
        updates.baseAtk = prev.baseAtk + 3;
        addLog('success', `【强化】攻击力提升至 ${prev.baseAtk + 3}`);
      } else if (stat === 'def') {
        updates.baseDef = prev.baseDef + 2;
        addLog('success', `【强化】防御力提升至 ${prev.baseDef + 2}`);
      } else if (stat === 'hp') {
        updates.maxHp = prev.maxHp + 20;
        updates.hp = prev.hp + 20;
        addLog('success', `【强化】最大生命提升至 ${prev.maxHp + 20}`);
      }
      
      return { ...prev, ...updates };
    });
  }, [player, addLog]);

  // 提交到排行榜
  const submitToLeaderboard = useCallback(async () => {
    if (!player) return;
    
    const entry = {
      name: player.name,
      classId: player.classId,
      level: player.level,
      totalKills: player.totalKills,
      gold: player.gold,
      timestamp: Date.now(),
    };
    
    // 同时保存到本地（作为备份）
    const saved = localStorage.getItem('rpg_leaderboard');
    let leaderboard = saved ? JSON.parse(saved) : [];
    leaderboard.push(entry);
    leaderboard.sort((a: { level: number; totalKills: number }, b: { level: number; totalKills: number }) => {
      if (b.level !== a.level) return b.level - a.level;
      return b.totalKills - a.totalKills;
    });
    leaderboard = leaderboard.slice(0, 100);
    localStorage.setItem('rpg_leaderboard', JSON.stringify(leaderboard));
    
    // 尝试提交到服务器
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: player.name,
          classId: player.classId,
          level: player.level,
          totalKills: player.totalKills,
          gold: player.gold,
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        addLog('success', `【排行榜】成绩已同步到云端排行榜！`);
      } else if (result.useLocalStorage) {
        addLog('success', `【排行榜】成绩已保存到本地排行榜！`);
      } else {
        addLog('warning', `【排行榜】${result.error || '提交失败'}，已保存到本地`);
      }
    } catch {
      addLog('success', `【排行榜】成绩已保存到本地排行榜！`);
    }
  }, [player, addLog]);

  if (!player) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-[#d4d4d4]">加载中...</div>
      </div>
    );
  }

  const cls = CHARACTER_CLASSES.find(c => c.id === player.classId) || CHARACTER_CLASSES[0];
  const upgradeCosts = {
    atk: Math.floor(80 * Math.pow(1.15, player.level)),
    def: Math.floor(60 * Math.pow(1.15, player.level)),
    hp: Math.floor(50 * Math.pow(1.15, player.level)),
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm">
      {/* 标题栏 */}
      <div className="h-8 bg-[#323233] flex items-center px-4 text-xs text-[#858585] border-b border-[#3c3c3c]">
        <div className="flex gap-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-[#f14c4c]"></div>
          <div className="w-3 h-3 rounded-full bg-[#dcdcaa]"></div>
          <div className="w-3 h-3 rounded-full bg-[#4ec9b0]"></div>
        </div>
        <span className="flex-1 text-center">main.js - 挂机RPG - Visual Studio Code</span>
        <Link href="/leaderboard" className="hover:text-[#dcdcaa]">🏆 排行榜</Link>
      </div>

      <div className="flex h-[calc(100vh-32px)]">
        {/* 左侧边栏 */}
        <div className="w-64 bg-[#252526] border-r border-[#3c3c3c] flex flex-col">
          <div className="p-2 text-xs text-[#858585] border-b border-[#3c3c3c] font-bold uppercase">
            资源管理器
          </div>
          
          <ScrollArea className="flex-1 p-2">
            {/* 角色信息 */}
            <div className="mb-4">
              <div className="text-[#569cd6] mb-2 flex items-center gap-2">
                <span>▼</span>
                <span>const <span className="text-[#9cdcfe]">{player.name}</span> = {'{'}</span>
              </div>
              
              <div className="pl-4 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#9cdcfe]">职业:</span>
                  <span className="text-[#ce9178]">{cls.emoji} {cls.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9cdcfe]">等级:</span>
                  <span className="text-[#b5cea8]">{player.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9cdcfe]">经验:</span>
                  <span className="text-[#b5cea8]">{player.exp}/{player.expToNext}</span>
                </div>
                <Progress value={(player.exp / player.expToNext) * 100} className="h-1 bg-[#3c3c3c]" />
                <div className="flex justify-between">
                  <span className="text-[#9cdcfe]">生命:</span>
                  <span className="text-[#f14c4c]">{player.hp}/{player.maxHp}</span>
                </div>
                <Progress value={(player.hp / player.maxHp) * 100} className="h-1 bg-[#3c3c3c] [&>div]:bg-[#f14c4c]" />
                <div className="flex justify-between">
                  <span className="text-[#9cdcfe]">魔力:</span>
                  <span className="text-[#4299e1]">{player.mp}/{player.maxMp}</span>
                </div>
                <Progress value={(player.mp / player.maxMp) * 100} className="h-1 bg-[#3c3c3c] [&>div]:bg-[#4299e1]" />
                <div className="flex justify-between">
                  <span className="text-[#9cdcfe]">攻击:</span>
                  <span className="text-[#b5cea8]">{getPlayerAtk()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9cdcfe]">防御:</span>
                  <span className="text-[#b5cea8]">{getPlayerDef()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9cdcfe]">金币:</span>
                  <span className="text-[#dcdcaa]">{player.gold}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9cdcfe]">击杀:</span>
                  <span className="text-[#b5cea8]">{player.totalKills}</span>
                </div>
              </div>
              <div className="text-[#858585] text-xs">{'}'};</div>
            </div>

            {/* 强化属性 */}
            <div className="mb-4">
              <div className="text-[#569cd6] mb-2">
                <span>function <span className="text-[#dcdcaa]">强化</span>() {'{'}</span>
              </div>
              <div className="pl-4 space-y-1">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full justify-between text-xs border-[#3c3c3c] bg-transparent hover:bg-[#3c3c3c]"
                  disabled={player.gold < upgradeCosts.atk}
                  onClick={() => upgradeStat('atk')}
                >
                  <span>攻击 +3</span>
                  <span className="text-[#dcdcaa]">{upgradeCosts.atk}金</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full justify-between text-xs border-[#3c3c3c] bg-transparent hover:bg-[#3c3c3c]"
                  disabled={player.gold < upgradeCosts.def}
                  onClick={() => upgradeStat('def')}
                >
                  <span>防御 +2</span>
                  <span className="text-[#dcdcaa]">{upgradeCosts.def}金</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full justify-between text-xs border-[#3c3c3c] bg-transparent hover:bg-[#3c3c3c]"
                  disabled={player.gold < upgradeCosts.hp}
                  onClick={() => upgradeStat('hp')}
                >
                  <span>生命 +20</span>
                  <span className="text-[#dcdcaa]">{upgradeCosts.hp}金</span>
                </Button>
              </div>
              <div className="text-[#858585] text-xs">{'}'}</div>
            </div>

            {/* 装备 */}
            <div className="mb-4">
              <div className="text-[#569cd6] mb-2">
                <span>const <span className="text-[#9cdcfe]">装备</span> = {'{'}</span>
              </div>
              <div className="pl-4 space-y-2">
                {(['mainHand', 'body', 'accessory'] as const).map(slot => {
                  const equip = player.equipment[slot];
                  const typeInfo = Object.values(EQUIPMENT_TYPES).find(t => t.slot === slot);
                  return (
                    <div 
                      key={slot}
                      onClick={() => equip && unequipItem(slot)}
                      className={`p-2 rounded border border-[#3c3c3c] ${equip ? 'cursor-pointer hover:border-[#569cd6]' : ''}`}
                    >
                      <div className="text-[#858585] text-xs">{typeInfo?.name}</div>
                      {equip ? (
                        <>
                          <div style={{ color: equip.color }}>{equip.name}</div>
                          <div className="text-xs text-[#858585]">
                            {equip.stats.atk ? `攻+${equip.stats.atk} ` : ''}
                            {equip.stats.def ? `防+${equip.stats.def} ` : ''}
                            {equip.stats.hp ? `血+${equip.stats.hp}` : ''}
                          </div>
                        </>
                      ) : (
                        <div className="text-[#858585]">空</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-[#858585] text-xs">{'}'};</div>
            </div>

            {/* 背包 */}
            <div className="mb-4">
              <div className="text-[#569cd6] mb-2">
                <span>const <span className="text-[#9cdcfe]">背包</span> = [</span>
              </div>
              <div className="pl-4 space-y-1 max-h-32 overflow-y-auto">
                {player.inventory.length === 0 ? (
                  <div className="text-[#858585] text-xs">// 背包为空</div>
                ) : (
                  player.inventory.map(item => (
                    <div key={item.id} className="p-1 rounded border border-[#3c3c3c] flex items-center gap-2">
                      <span style={{ color: item.color }} className="text-xs flex-1">{item.name}</span>
                      <Button size="sm" variant="ghost" className="h-5 text-xs px-1" onClick={() => equipItem(item.id)}>装</Button>
                      <Button size="sm" variant="ghost" className="h-5 text-xs px-1 text-[#f14c4c]" onClick={() => sellItem(item.id)}>卖</Button>
                    </div>
                  ))
                )}
              </div>
              <div className="text-[#858585] text-xs">];</div>
            </div>
          </ScrollArea>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col">
          {/* Tab栏 */}
          <div className="h-9 bg-[#252526] flex items-center border-b border-[#3c3c3c]">
            <div className="px-4 py-2 bg-[#1e1e1e] border-t-2 border-[#569cd6] text-xs">
              main.js
            </div>
            <div className="px-4 py-2 text-[#858585] text-xs">
              package.json
            </div>
            <div className="ml-auto px-4">
              <Button size="sm" variant="ghost" className="text-xs" onClick={submitToLeaderboard}>
                📤 提交排行榜
              </Button>
            </div>
          </div>

          {/* 编辑器内容 */}
          <div className="flex-1 p-4 overflow-auto">
            {/* 敌人信息 */}
            <div className="mb-6 p-4 bg-[#1e1e1e] rounded border border-[#3c3c3c]">
              <div className="text-[#6a9955]">// 当前目标</div>
              <div>
                <span className="text-[#569cd6]">const</span>{' '}
                <span className="text-[#9cdcfe]">敌人</span> = {'{'}
              </div>
              <div className="pl-4">
                <span className="text-[#9cdcfe]">名称:</span>{' '}
                <span className="text-[#ce9178]">{enemy ? `${enemy.emoji} ${enemy.name}` : '"无"'}</span>,
              </div>
              <div className="pl-4">
                <span className="text-[#9cdcfe]">生命:</span>{' '}
                <span className="text-[#b5cea8]">
                  {enemy ? `${enemy.hp}/${enemy.maxHp}` : '0/0'}
                </span>
              </div>
              <div>{'}'};</div>
              
              {enemy && (
                <>
                  <div className="mt-2 text-[#6a9955]">// 生命条</div>
                  <Progress value={(enemy.hp / enemy.maxHp) * 100} className="h-2 bg-[#3c3c3c] [&>div]:bg-[#f14c4c]" />
                  <div className="mt-2 text-xs text-[#858585]">
                    <span className="text-[#9cdcfe]">攻击</span> = {enemy.atk},{' '}
                    <span className="text-[#9cdcfe]">防御</span> = {enemy.def}
                  </div>
                </>
              )}
            </div>

            {/* 技能按钮 */}
            <div className="mb-6">
              <div className="text-[#6a9955]">// ========== 战斗操作 ==========</div>
              <div>
                <span className="text-[#569cd6]">function</span>{' '}
                <span className="text-[#dcdcaa]">战斗</span>() {'{'}
              </div>
              <div className="pl-4 flex flex-wrap gap-2 py-2">
                {SKILLS.map(skill => {
                  const unlocked = player.unlockedSkills.includes(skill.id);
                  const cooldown = player.skillCooldowns[skill.id] || 0;
                  const canUse = unlocked && cooldown === 0 && player.mp >= skill.mpCost && inBattle;
                  
                  return (
                    <Button
                      key={skill.id}
                      size="sm"
                      variant={canUse ? 'default' : 'outline'}
                      className={`text-xs ${canUse ? 'bg-[#569cd6] hover:bg-[#4a8cd4]' : 'border-[#3c3c3c] bg-transparent'}`}
                      disabled={!canUse}
                      onClick={() => useSkill(skill.id)}
                    >
                      {skill.icon} {skill.name}
                      {cooldown > 0 && ` (${cooldown})`}
                      {skill.mpCost > 0 && <span className="ml-1 text-[#4299e1]">{skill.mpCost}</span>}
                    </Button>
                  );
                })}
              </div>
              <div>{'}'}</div>
            </div>

            {/* 寻找敌人按钮 */}
            <div className="mb-4">
              <Button
                size="lg"
                className="bg-[#569cd6] hover:bg-[#4a8cd4] text-white"
                onClick={spawnEnemy}
                disabled={inBattle}
              >
                🔍 寻找敌人
              </Button>
            </div>

            {/* 游戏说明 */}
            <div className="text-[#6a9955] space-y-1">
              <div>// ========== 游戏说明 ==========</div>
              <div>// 点击"寻找敌人"开始战斗</div>
              <div>// 使用技能攻击敌人，注意魔力消耗</div>
              <div>// 装备从背包手动穿戴，点击已装备可卸下</div>
              <div>// 敌人可能会逃跑，也可能击败你</div>
            </div>
          </div>

          {/* 底部终端 */}
          <div className="h-48 bg-[#0c0c0c] border-t border-[#3c3c3c]">
            <div className="h-8 bg-[#252526] flex items-center px-4 text-xs text-[#858585] border-b border-[#3c3c3c]">
              <span className="border-b-2 border-[#569cd6] text-[#d4d4d4] pb-1">调试控制台</span>
            </div>
            <ScrollArea className="h-[calc(100%-32px)] p-2">
              {logs.map((log, i) => (
                <div 
                  key={i} 
                  className={`text-xs ${
                    log.type === 'error' ? 'text-[#f14c4c]' :
                    log.type === 'success' ? 'text-[#4ec9b0]' :
                    log.type === 'warning' ? 'text-[#dcdcaa]' :
                    log.type === 'loot' ? 'text-[#ce9178]' :
                    log.type === 'level' ? 'text-[#c586c0]' :
                    log.type === 'combat' ? 'text-[#d4d4d4]' :
                    'text-[#858585]'
                  }`}
                >
                  {log.time} {log.message}
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* 状态栏 */}
      <div className="h-6 bg-[#569cd6] flex items-center px-4 text-xs text-white">
        <span className="mr-4">⚔️ {player.level}级</span>
        <span className="mr-4">💰 {player.gold} 金币</span>
        <span className="mr-4">💀 {player.totalKills} 击杀</span>
        <div className="flex-1"></div>
        <span>行 1, 列 1</span>
        <span className="ml-4">UTF-8</span>
        <span className="ml-4">JavaScript</span>
      </div>
    </div>
  );
}
