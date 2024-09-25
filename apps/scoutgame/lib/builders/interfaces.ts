export type BasicUserInfo = {
  id: string;
  username: string;
  avatar?: string | null;
  displayName: string;
  bio?: string | null;
  githubLogin?: string;
};

export type PointMetrics = {
  seasonPoints: number;
  allTimePoints: number;
};

/**
 * @scoutedBy - Unique number of scouts that scouted this user
 * @nftsSold - The total number of tokens issued for this user
 */
export type BuilderMetrics = {
  scoutedBy: number;
  nftsSold: number;
  gemsCollected: number;
  price: number;
  builderPoints: number;
  isBanned?: boolean;
};

export type BuilderInfo = BasicUserInfo & BuilderMetrics;
