import type { DiscordUser, FavoritePage, Poap, SpaceRole, User, Role as RoleMembership, SpaceRoleToRole, TelegramUser } from '@prisma/client';

export { FavoritePage, SpaceRole, User };

export interface Contributor extends Omit<User, 'addresses'> {
  isAdmin: boolean;
  joinDate: string;
}

interface NestedMemberships {
  spaceRoleToRole: (SpaceRoleToRole & { role: RoleMembership })[]
}

export interface LoggedInUser extends User {
  favorites: FavoritePage[];
  spaceRoles: (SpaceRole & NestedMemberships)[]
  ensName?: string;
  discordUser?: DiscordUser | null
  telegramUser?: TelegramUser | null
}

export interface ExtendedPoap extends Poap {
  imageURL: string;
  isHidden: boolean;
}

export const IDENTITY_TYPES = ['Wallet', 'Discord', 'Telegram', 'RandomName'] as const;
export type IdentityType = typeof IDENTITY_TYPES[number];
