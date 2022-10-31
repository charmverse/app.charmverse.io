import type { DiscordUser, FavoritePage, Role as RoleMembership, SpaceRole, SpaceRoleToRole, TelegramUser, User, UserNotificationState } from '@prisma/client';

export { FavoritePage, SpaceRole, User };

interface NestedMemberships {
  spaceRoleToRole: (SpaceRoleToRole & { role: RoleMembership })[];
}

export interface LoggedInUser extends User {
  favorites: { pageId: string }[];
  spaceRoles: (SpaceRole & NestedMemberships)[];
  wallets: { address: string }[];
  ensName?: string;
  discordUser?: DiscordUser | null;
  telegramUser?: TelegramUser | null;
  notificationState?: UserNotificationState | null;
  isNew?: boolean;
}

export const IDENTITY_TYPES = ['Wallet', 'Discord', 'Telegram', 'RandomName'] as const;
export type IdentityType = typeof IDENTITY_TYPES[number];
