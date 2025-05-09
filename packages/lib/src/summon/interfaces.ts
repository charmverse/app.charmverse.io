export type SummonAchievement = {
  name: string; // 'Onboarding Hero',
  description: string; // 'Complete the game7 onboarding process without error',
  rank: number; // 0.01,
  xp: number;
  rarity: string; // 'common',
  publish: number; // 1,
  status: number; // 1,
  image: string; // 'C:\\fakepath\\Custom Room - Copy.png',
  attributes: any;
  state: string; // 'published:active',
  tenant: string; // '123458676909922',
  ts: number; // 1674491549620000;
  id: string; // '354662534299517012';
};

export type SummonUserInventory = {
  id: string;
  user: string;
  meta: {
    achievements: any[] | number;
    trophies: any[] | number;
    xp: number; // ex: 2761
    rank: number; // ex: 3.519999999999
    rankName: string; // ex: 'mighty mouse';
    avatarUrl: string;
  };
  achievements: {
    taskId: string;
    userTaskId: string;
    achievementId: string;
    ts: number;
    userAchievementId: string;
  }[];
  trophies: any[];
  xp: any[];
  rank: any[];
  state: string; // ex: 'submission:review'
  status: number;
  tenant: string; // ex: '123458676909922'
  ts: number; // ex: 1677004422330000
  quests: any[];
  tasks: any[];
  materials: any[];
  gear: any[];
};

export type SummonUserProfile = {
  id: string;
  tenantId: string;
  // avatar: string;
  // username: string;
  meta: SummonUserInventory['meta'];
};
