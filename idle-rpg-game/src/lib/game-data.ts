// 游戏数据定义

export const MONSTERS = [
  { name: '史莱姆', hp: 80, atk: 5, def: 2, exp: 15, gold: 8, fleeRate: 0.1, emoji: '🟢' },
  { name: '哥布林', hp: 150, atk: 12, def: 5, exp: 35, gold: 20, fleeRate: 0.15, emoji: '👺' },
  { name: '骷髅兵', hp: 250, atk: 20, def: 10, exp: 60, gold: 35, fleeRate: 0.12, emoji: '💀' },
  { name: '兽人', hp: 400, atk: 32, def: 18, exp: 100, gold: 60, fleeRate: 0.18, emoji: '👹' },
  { name: '暗黑骑士', hp: 600, atk: 45, def: 28, exp: 160, gold: 100, fleeRate: 0.15, emoji: '🖤' },
  { name: '巨龙', hp: 1000, atk: 65, def: 40, exp: 280, gold: 180, fleeRate: 0.2, emoji: '🐉' },
  { name: '恶魔', hp: 1500, atk: 90, def: 55, exp: 450, gold: 300, fleeRate: 0.22, emoji: '😈' },
  { name: '魔神', hp: 2500, atk: 130, def: 80, exp: 800, gold: 500, fleeRate: 0.25, emoji: '👿' },
];

export const EQUIPMENT_TYPES = {
  weapon: { name: '武器', icon: '⚔️', slot: 'mainHand' as const },
  armor: { name: '护甲', icon: '🛡️', slot: 'body' as const },
  accessory: { name: '饰品', icon: '💎', slot: 'accessory' as const },
};

export const EQUIPMENT_RARITIES = [
  { name: '普通', color: '#aaaaaa', multiplier: 1 },
  { name: '稀有', color: '#4ec9b0', multiplier: 1.5 },
  { name: '史诗', color: '#c586c0', multiplier: 2.2 },
  { name: '传说', color: '#dcdcaa', multiplier: 3.5 },
];

export const EQUIPMENT_NAMES = {
  weapon: ['木剑', '铁剑', '钢刃', '火焰剑', '屠龙刀', '圣剑'],
  armor: ['布甲', '皮甲', '锁子甲', '板甲', '龙鳞甲', '圣袍'],
  accessory: ['幸运戒指', '力量项链', '疾风之靴', '暴击之眼', '龙心', '无限宝石'],
};

export const SKILLS = [
  { 
    id: 'attack', 
    name: '普通攻击', 
    desc: '基础攻击', 
    cooldown: 0, 
    mpCost: 0,
    type: 'damage' as const,
    value: 1,
    icon: '⚔️',
    unlockLevel: 1,
  },
  { 
    id: 'heavyStrike', 
    name: '重击', 
    desc: '造成200%伤害', 
    cooldown: 3, 
    mpCost: 10,
    type: 'damage' as const,
    value: 2,
    icon: '💥',
    unlockLevel: 1,
  },
  { 
    id: 'fireball', 
    name: '火球术', 
    desc: '造成250%伤害', 
    cooldown: 4, 
    mpCost: 20,
    type: 'damage' as const,
    value: 2.5,
    icon: '🔥',
    unlockLevel: 5,
  },
  { 
    id: 'thunder', 
    name: '雷电', 
    desc: '造成350%伤害', 
    cooldown: 6, 
    mpCost: 35,
    type: 'damage' as const,
    value: 3.5,
    icon: '⚡',
    unlockLevel: 10,
  },
  { 
    id: 'defend', 
    name: '防御', 
    desc: '减少50%下次受到的伤害', 
    cooldown: 2, 
    mpCost: 5,
    type: 'defend' as const,
    value: 0.5,
    icon: '🛡️',
    unlockLevel: 1,
  },
  { 
    id: 'heal', 
    name: '治疗', 
    desc: '恢复30%最大生命', 
    cooldown: 5, 
    mpCost: 25,
    type: 'heal' as const,
    value: 0.3,
    icon: '💚',
    unlockLevel: 3,
  },
  { 
    id: 'criticalStrike', 
    name: '致命一击', 
    desc: '造成500%伤害', 
    cooldown: 10, 
    mpCost: 50,
    type: 'damage' as const,
    value: 5,
    icon: '💀',
    unlockLevel: 15,
  },
];

export const CHARACTER_CLASSES = [
  {
    id: 'warrior',
    name: '战士',
    desc: '攻守兼备，适合新手',
    emoji: '⚔️',
    baseHp: 120,
    baseMp: 40,
    baseAtk: 18,
    baseDef: 8,
    critRate: 0.08,
  },
  {
    id: 'mage',
    name: '法师',
    desc: '高魔力，技能伤害高',
    emoji: '🔮',
    baseHp: 80,
    baseMp: 80,
    baseAtk: 12,
    baseDef: 4,
    critRate: 0.12,
  },
  {
    id: 'rogue',
    name: '刺客',
    desc: '高暴击，快速击杀',
    emoji: '🗡️',
    baseHp: 90,
    baseMp: 50,
    baseAtk: 22,
    baseDef: 5,
    critRate: 0.2,
  },
];

export interface Equipment {
  id: number;
  type: keyof typeof EQUIPMENT_TYPES;
  name: string;
  rarity: string;
  color: string;
  stats: {
    atk?: number;
    def?: number;
    hp?: number;
    critRate?: number;
  };
}

export interface PlayerState {
  name: string;
  classId: string;
  level: number;
  exp: number;
  expToNext: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  baseAtk: number;
  baseDef: number;
  critRate: number;
  gold: number;
  totalKills: number;
  isDefending: boolean;
  equipment: {
    mainHand: Equipment | null;
    body: Equipment | null;
    accessory: Equipment | null;
  };
  inventory: Equipment[];
  unlockedSkills: string[];
  skillCooldowns: Record<string, number>;
}

export interface Enemy {
  name: string;
  emoji: string;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  exp: number;
  gold: number;
  fleeRate: number;
}

export interface LeaderboardEntry {
  name: string;
  classId: string;
  level: number;
  totalKills: number;
  gold: number;
  timestamp: number;
}
