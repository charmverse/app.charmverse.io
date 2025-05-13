import { guild } from './client';

export async function getGuildDetails(guildUrlOrId: string | number) {
  const resp = await guild.get(guildUrlOrId);
  return resp;
}
