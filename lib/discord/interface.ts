export interface DiscordServerRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  icon?: string;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
  tags?: {
    bot_id?: string;
    integration_id?: string;
  }[];
}

export type CheckDiscordGateResult = {
  hasDiscordServer: boolean;
  isVerified: boolean;
  spaceId: string;
};
