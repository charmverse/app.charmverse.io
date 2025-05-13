import type { DiscordGuildMember } from '../assignRoles';

import { authenticatedRequest, handleDiscordResponse } from './handleDiscordResponse';

// TODO: combine these methods
export function getGuildMember({ guildId, memberId }: { guildId: string; memberId: string }) {
  return authenticatedRequest<DiscordGuildMember>(`https://discord.com/api/v8/guilds/${guildId}/members/${memberId}`);
}

export function getGuildMemberHandled({ guildId, memberId }: { guildId: string; memberId: string }) {
  return handleDiscordResponse<DiscordGuildMember | null>(
    `https://discord.com/api/v8/guilds/${guildId}/members/${memberId}`
  );
}
