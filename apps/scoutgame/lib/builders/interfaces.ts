import type { BasicUserInfo } from 'lib/users/interfaces';

export type PointMetrics = {
  seasonPoints: number;
  allTimePoints: number;
};

/**
 * @scoutedBy - Unique number of scouts that scouted this user
 * @nftsSold - The total number of tokens issued for this user
 */
export type BuilderMetrics = {
  // scoutedBy: number;
  nftsSold: number;
  gemsCollected: number;
  price: bigint;
  builderPoints: number;
  isBanned?: boolean;
};

export type BuilderInfo = BasicUserInfo &
  BuilderMetrics & {
    nftImageUrl?: string | null;
    nftsSoldToScout?: number;
  };
