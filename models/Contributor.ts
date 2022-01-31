
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
  address: string;
  username: string;
  favorites: FavoritePage[];
  spaceRoles: SpaceRole[];
}
