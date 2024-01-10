import * as http from '@charmverse/core/http';

import type { SummonAchievement, SummonUserInventory, SummonUserProfile } from './interfaces';

const apiToken = process.env.XPS_API_TOKEN as string | undefined;

const headers = {
  Authorization: apiToken ? `Bearer ${apiToken}` : null
};

export const SUMMON_BASE_URL = 'https://g7p.io/v1/xps';

type ApiResponse<T> = {
  data: T;
  status: 1;
  message: string; // 'resource was found'
};

// ### Find the user identity by: email, discordHandle, walletAddress, githubUsername
// `/v1/xps/scan/identity?walletAddress=`
// `/v1/xps/scan/identity?email=`
// `/v1/xps/scan/identity?discordHandle=`

export async function findUserByIdentity(
  query: {
    walletAddress?: string;
    email?: string;
    discordHandle?: string;
    githubUsername?: string;
  },
  summonApiUrl: string = SUMMON_BASE_URL
): Promise<string | null> {
  const result = await http.GET<ApiResponse<{ userId: string }>>(`${summonApiUrl}/scan/identity`, query, {
    headers
  });
  // Note that an empty Apiresponse looks very similar to positive result: {
  //  status: 1,
  //  message: 'resource not found',
  //  data: { userId: '' }
  // }
  return result.data.userId ? result.data.userId : null;
}

// ### Read user information about achievements by userId
// `/v1/xps/scan/inventory/{userId}`
export async function getUserInventory({ summonApiUrl, xpsEngineId }: { xpsEngineId: string; summonApiUrl: string }) {
  const { data } = await http.GET<ApiResponse<SummonUserInventory | null>>(
    `${summonApiUrl}/scan/inventory/${xpsEngineId}`,
    {},
    { headers }
  );
  return data;
}

export async function getUserSummonProfile(props: {
  xpsEngineId: string;
  summonApiUrl: string;
}): Promise<SummonUserProfile | null> {
  const inventory = await getUserInventory(props);
  if (inventory) {
    const { user, tenant, meta, ...profile } = inventory;
    return {
      id: user,
      tenantId: tenant,
      meta
    };
  }
  return null;
}

// ### User achievements
// `/v1/xps/achievement/{achievementId}`
export async function getAchievementById({
  achievementId,
  summonApiUrl
}: {
  summonApiUrl: string;
  achievementId: string;
}) {
  try {
    const { data } = await http.GET<ApiResponse<SummonAchievement | null>>(
      `${summonApiUrl}/achievement/${achievementId}`,
      {},
      { headers }
    );
    return data;
  } catch (error: any) {
    if (error.message === 'resource not found') {
      return null;
    }
    return Promise.reject(error);
  }
}

export async function findUserXpsEngineId({
  walletAddresses,
  userEmail,
  discordUserAccount,
  summonApiUrl
}: {
  summonApiUrl: string;
  discordUserAccount: { username: string } | null;
  userEmail: string | null;
  walletAddresses: string[];
}) {
  let userXpsEngineId: string | null = null;
  for (const walletAddress of walletAddresses) {
    userXpsEngineId = await findUserByIdentity(
      {
        walletAddress
      },
      summonApiUrl
    );

    if (userXpsEngineId) {
      break;
    }
  }

  if (!userXpsEngineId && userEmail) {
    userXpsEngineId = await findUserByIdentity(
      {
        email: userEmail
      },
      summonApiUrl
    );
  }

  if (discordUserAccount && !userXpsEngineId) {
    userXpsEngineId = await findUserByIdentity(
      {
        discordHandle: discordUserAccount.username
      },
      summonApiUrl
    );
  }

  return userXpsEngineId;
}
