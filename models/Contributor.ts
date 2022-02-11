import type { FavoritePage, SpacePermission, User } from '@prisma/client';

export { FavoritePage, SpacePermission, User };

export type SpacePermissionType = 'admin' | 'contributor';

export interface Contributor extends User {
  spacePermissions: (Pick<SpacePermission, 'userId' | 'spaceId'> & { type: SpacePermissionType })[];
}

export interface ContributorUser extends Contributor {
  favorites: FavoritePage[];
  isLoading: boolean;
  linkedAddressesCount: number; // from guild.xyz
}
