import type { DiscordUser, FavoritePage, Poap, SpaceRole, User, Role as RoleMembership, SpaceRoleToRole, TelegramUser, UserNotificationState } from '@prisma/client';

export { FavoritePage, SpaceRole, User };

export interface Contributor extends Omit<User, 'addresses'> {
  isAdmin: boolean;
  joinDate: string;
  nftAvatar?: boolean
}

interface NestedMemberships {
  spaceRoleToRole: (SpaceRoleToRole & { role: RoleMembership })[]
}

export interface LoggedInUser extends User {
  favorites: { pageId: string }[];
  spaceRoles: (SpaceRole & NestedMemberships)[]
  ensName?: string;
  discordUser?: DiscordUser | null
  telegramUser?: TelegramUser | null
  notificationState?: UserNotificationState | null
}

export interface ExtendedPoap extends Poap {
  imageURL: string;
  isHidden: boolean;
}

export const IDENTITY_TYPES = ['Wallet', 'Discord', 'Telegram', 'RandomName'] as const;
export type IdentityType = typeof IDENTITY_TYPES[number];
