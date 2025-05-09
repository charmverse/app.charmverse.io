import type { DiscordServerRole } from '../interface';

import { authenticatedRequest, handleDiscordResponse } from './handleDiscordResponse';

// TODO: combine these methods
export function getGuildRoles(guildId: string) {
  return authenticatedRequest<DiscordServerRole[]>(`https://discord.com/api/v8/guilds/${guildId}/roles`);
}

export function getGuildRolesHandled(guildId: string) {
  return handleDiscordResponse<DiscordServerRole[]>(`https://discord.com/api/v8/guilds/${guildId}/roles`);
}
