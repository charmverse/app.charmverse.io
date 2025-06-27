import * as http from '@packages/core/http';

export const DISCORD_API_URL = 'https://discord.com/api/v8';
const DISCORD_OAUTH_TOKEN_ENDPOINT = '/oauth2/token';
const DISCORD_OAUTH_CLIENT_ID = process.env.DISCORD_OAUTH_CLIENT_ID as string;
const DISCORD_OAUTH_CLIENT_SECRET = process.env.DISCORD_OAUTH_CLIENT_SECRET as string;

export async function getDiscordToken({
  code,
  redirectUrl,
  discordApiUrl
}: {
  code: string;
  discordApiUrl?: string;
  redirectUrl: string;
}) {
  const params = new URLSearchParams();
  params.append('client_id', DISCORD_OAUTH_CLIENT_ID);
  params.append('client_secret', DISCORD_OAUTH_CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirectUrl);

  const token = (await http.POST(`${discordApiUrl ?? DISCORD_API_URL}${DISCORD_OAUTH_TOKEN_ENDPOINT}`, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    skipStringifying: true
  })) as { access_token: string; expires_in: number; refresh_token: string; scope: string; token_type: string };

  return token;
}
