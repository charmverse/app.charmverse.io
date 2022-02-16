import type { FavoritePage, SpaceRole, User } from '@prisma/client';

export { FavoritePage, SpaceRole, User };

export type Role = 'admin' | 'contributor';

export interface PopulatedUser extends User {
  spaceRoles: (Pick<SpaceRole, 'userId' | 'spaceId'> & { role: Role })[];
}

export interface LoggedInUser extends User {
  favorites: FavoritePage[];
  isLoading: boolean;
  linkedAddressesCount: number; // from guild.xyz
}
