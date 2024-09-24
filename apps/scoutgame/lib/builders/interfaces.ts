export type BasicUserInfo = {
  id: string;
  username: string;
  avatar: string | null;
};

// export type ScontInfo = {
//   buildersScouted: number;

//   nftsSold: number;
//   gems: number;
//   price: number;
// };

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
  gems: number;
  price: number;
};

export type BuilderUserInfo = BasicUserInfo & BuilderMetrics;
