import type { DiscordUser, FavoritePage, SpaceRole, User, Role as RoleMembership, SpaceRoleToRole, TelegramUser } from '@prisma/client';

export { FavoritePage, SpaceRole, User };

export type Role = 'admin' | 'contributor';

export interface Contributor extends User {
  role: Role;
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
