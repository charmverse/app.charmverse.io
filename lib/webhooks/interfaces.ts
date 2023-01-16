export type MessageType = 'guildMemberUpdate' | 'guildMemberRemove';

export type MemberWebhookData = {
  guildId: string;
  userId: string;
  roles: string[];
};

export type WebhookMessageData = {
  event: MessageType;
  payload: MemberWebhookData[];
};

export type WebhookMessageHeaders = {
  Authorization?: string;
};

export type WebhookMessageQuery = {
  api_key?: string;
};

export type WebhookMessage = {
  data?: WebhookMessageData;
  headers?: WebhookMessageHeaders;
  query?: WebhookMessageQuery;
};
