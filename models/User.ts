import type { DiscordUser, FavoritePage, SpaceRole, User, Role as RoleMembership, SpaceRoleToRole, TelegramUser } from '@prisma/client';

export { FavoritePage, SpaceRole, User };

export interface Contributor extends User {
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
