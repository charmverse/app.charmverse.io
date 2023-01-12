import type { ExternalRole } from 'lib/roles';

export type MessageType = 'add_member' | 'remove_member' | 'add_role' | 'remove_role';

export type GuildMember = {
  discordId: string;
  username?: string;
  avatar?: string;
};

export type MemberWebhookData = {
  type: 'add_member' | 'remove_member';
  guild_id: string;
  member: GuildMember;
};

export type MemberRoleWebhookData = {
  type: 'add_role' | 'remove_role';
  guild_id: string;
  member: GuildMember;
  role: ExternalRole;
};

export type WebhookMessageData = MemberRoleWebhookData | MemberWebhookData;

export type WebhookMessageHeaders = {
  Authorization?: string;
};

export type WebhookMessageQuery = {
  api_key?: string;
};

export type WebhookMessage = {
  data?: WebhookMessageData;
  headers?: WebhookMessageData;
  query?: WebhookMessageQuery;
};
