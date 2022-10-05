import * as http from 'adapters/http';

import { getDiscordToken } from './getDiscordToken';

export interface DiscordAccount {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  verified?: boolean;
  bot?: boolean;
}

export async function getDiscordAccount (code: string, redirectUrl: string) {
  const token = await getDiscordToken(code, redirectUrl);
  return http.GET<DiscordAccount>('https://discord.com/api/v8/users/@me', undefined, {
    headers: {
      Authorization: `Bearer ${token.access_token}`
    }
  });
}
