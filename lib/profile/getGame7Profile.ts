import * as http from '@charmverse/core/http';
import { prisma } from '@charmverse/core/prisma-client';

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

async function getGame7UserId(queryObj: Record<string, any>) {
  const game7Token = process.env.GAME7_TOKEN;
  if (!game7Token) {
    return null;
  }

  const queryString = Object.keys(queryObj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryObj[key])}`)
    .join('&');

  const data = await http.GET<Game7ScanIdentityResponse>(
    `https://g7p.io/v1/xps/scan/identity?${queryString}`,
    undefined,
    {
      headers: {
        Authorization: `Bearer ${game7Token}`
      }
    }
  );

  if (!data.data.userId) {
    return null;
  }

  return data.data.userId;
}

export async function getGame7Profile({ userId }: { userId: string }): Promise<null | Game7Inventory> {
  const game7Token = process.env.GAME7_TOKEN;
  if (!game7Token) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      wallets: {
        select: {
          address: true
        }
      },
      email: true,
      discordUser: {
        select: {
          account: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  const discordUserAccount = user.discordUser?.account;
  const userEmail = user.email;

  const walletAddresses = user.wallets.map((wallet) => wallet.address);
  let game7UserId: string | null = null;

  for (const walletAddress of walletAddresses) {
    const game7UserIdString = await getGame7UserId({
      walletAddress
    });

    if (userId) {
      game7UserId = game7UserIdString;
      break;
    }
  }

  if (!game7UserId && userEmail) {
    const game7UserIdString = await getGame7UserId({
      email: userEmail
    });

    if (userId) {
      game7UserId = game7UserIdString;
    }
  }

  if (!game7UserId && discordUserAccount) {
    const discordUsername = (discordUserAccount as any).username as undefined | string;
    if (discordUsername) {
      const game7UserIdString = await getGame7UserId({
        discordHandle: encodeURI(discordUsername)
      });

      if (userId) {
        game7UserId = game7UserIdString;
      }
    }
  }

  if (!game7UserId) {
    return null;
  }

  const userInventory = await http.GET<Game7ScanInventoryResponse>(
    `https://g7p.io/v1/xps/scan/inventory/${game7UserId}`,
    undefined,
    {
      headers: {
        Authorization: `Bearer ${game7Token}`
      }
    }
  );

  if (!userInventory.data) {
    return null;
  }

  return userInventory.data;
}
