import type { FavoritePage, SpaceRole, User } from '@prisma/client';

export { FavoritePage, SpaceRole, User };

export type Role = 'admin' | 'contributor';

export interface Contributor extends User {
  role: Role;
}

export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar?: string
  verified?: boolean
}

export interface LoggedInUser extends User {
  favorites: FavoritePage[];
  spaceRoles: SpaceRole []
  ensName?: string;
}
