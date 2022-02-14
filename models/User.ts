
export interface FavoritePage {
  pageId: string;
  userId: string;
}

export interface SpaceRole {
  type: 'admin' | 'contributor';
  spaceId: string;
  userId: string;
}

export interface User {
  id: string;
  addresses: string[];
  discordId?: string;
  spaceRoles: SpaceRole[];
}

export interface LoggedInUser extends User {
  favorites: FavoritePage[];
  isLoading: boolean;
  linkedAddressesCount: number; // from guild.xyz
}
