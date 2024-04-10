export type MessageType = 'guildMemberUpdate' | 'guildMemberRemove' | 'uninstallMiniapp';

export type MemberWebhookData = {
  guildId: string;
  userId: string;
  roles: string[];
};

export type UninstallWebhookData = {
  guildId: string;
  userId: string;
};

export type MemberUpdateWebhookMessageData = {
  event: 'guildMemberUpdate' | 'guildMemberRemove';
  payload: MemberWebhookData[];
};

export type UninstallWebhookMessageData = {
  event: 'uninstallMiniapp';
  payload: UninstallWebhookData;
};

export type WebhookMessageData = MemberUpdateWebhookMessageData | UninstallWebhookMessageData;

export type WebhookMessageHeaders = {
  Authorization?: string;
};

export type WebhookMessageQuery = {
  api_key?: string;
};

export type WebhookMessage<Data extends WebhookMessageData = WebhookMessageData> = {
  data?: Data;
  headers?: WebhookMessageHeaders;
  query?: WebhookMessageQuery;
};

export type WebhookMessageProcessResult = {
  success: boolean;
  message?: string;
  spaceIds?: string[];
};
