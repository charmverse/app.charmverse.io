
export interface FavoritePage {
  pageId: string;
  userId: string;
}

export interface SpaceRole {
  type: 'admin' | 'contributor';
  spaceId: string;
  userId: string;
}

export interface Contributor {
  id: string;
  addresses: string[];
  discordId?: string;
  username: string;
  spaceRoles: SpaceRole[];
}

export interface ContributorUser extends Contributor {
  favorites: FavoritePage[];
  isLoading: boolean;
  linkedAddressesCount: number; // from guild.xyz
}
