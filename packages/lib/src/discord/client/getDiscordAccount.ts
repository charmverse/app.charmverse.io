import * as http from '@packages/core/http';

import { getDiscordToken, DISCORD_API_URL } from './getDiscordToken';

export interface DiscordAccount {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  verified?: boolean;
  bot?: boolean;
}

export async function getDiscordAccount(props: { code: string; discordApiUrl?: string; redirectUrl: string }) {
  const token = await getDiscordToken(props);
  return http.GET<DiscordAccount>(`${props.discordApiUrl ?? DISCORD_API_URL}/users/@me`, undefined, {
    headers: {
      Authorization: `Bearer ${token.access_token}`
    }
  });
}
