import type { FavoritePage, SpacePermission, User } from '@prisma/client';

export { FavoritePage, SpacePermission, User };

export type SpacePermissionType = 'admin' | 'contributor';

export interface PopulatedUser extends User {
  spacePermissions: (Pick<SpacePermission, 'userId' | 'spaceId'> & { type: SpacePermissionType })[];
}

export interface LoggedInUser extends User {
  favorites: FavoritePage[];
  isLoading: boolean;
  linkedAddressesCount: number; // from guild.xyz
}
