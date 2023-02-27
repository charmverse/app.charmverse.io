import * as http from 'adapters/http';

import type { XPSAchievement, XPSUserInventory } from './interfaces';

const apiToken = process.env.XPS_API_TOKEN as string | undefined;

const headers = {
  Authorization: apiToken ? `Bearer ${apiToken}` : null
};

const baseUrl = 'https://g7p.io/v1/xps';

type ApiResponse<T> = {
  data: T;
  status: 1;
  message: string; // 'resource was found'
};

// ### Find the user identity by: email, discordHandle, walletAddress, githubUsername
// `/v1/xps/scan/identity?walletAddress=`
// `/v1/xps/scan/identity?email=`
// `/v1/xps/scan/identity?discordHandle=`

export async function findUserByIdentity(query: {
  walletAddress?: string;
  email?: string;
  discordHandle?: string;
  githubUsername?: string;
}): Promise<string | null> {
  const result = await http.GET<ApiResponse<{ userId: string }>>(`${baseUrl}/scan/identity`, query, { headers });
  // Note that an empty Apiresponse looks very similar to positive result: {
  //  status: 1,
  //  message: 'resource not found',
  //  data: { userId: '' }
  // }
  return result.data.userId ? result.data.userId : null;
}

// ### Read user information about achievements by userId
// `/v1/xps/scan/inventory/{userId}`
export function getUserInventory(userId: string) {
  return http
    .GET<ApiResponse<XPSUserInventory | null>>(`${baseUrl}/scan/inventory/${userId}`, {}, { headers })
    .then(({ data }) => data);
}

// ### User achievements
// `/v1/xps/achievement/{achievementId}`
export function getAchievementById(achievementId: string) {
  return http
    .GET<ApiResponse<XPSAchievement | null>>(`${baseUrl}/achievement/${achievementId}`, {}, { headers })
    .then(({ data }) => data)
    .catch((error) => {
      if (error.message === 'resource not found') {
        return null;
      }
      return Promise.reject(error);
    });
}
