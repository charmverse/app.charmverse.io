export interface Game7ScanIdentityResponse {
  status: number;
  message: string;
  data: {
    userId: string;
  };
}

export type Game7Inventory = {
  user: string;
  meta: {
    xp: number;
    rank: number;
    achievements: string[];
    trophies: string[];
    rankName: string;
    materials: Record<string, unknown>;
    avatarUrl: string;
  };
  achievements: string[];
  trophies: string[];
  xp: string[];
  rank: string[];
  state: string;
  status: number;
  tenant: string;
  ts: number;
  quests: string[];
  tasks: string[];
  materials: string[];
  gear: string[];
};

export type Game7ScanInventoryResponse =
  | {
      status: 1;
      message: string;
      data: Game7Inventory;
    }
  | {
      status: 0;
      message: string;
      data: null;
    };
