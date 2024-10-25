import type { BuilderStatus } from '@charmverse/core/prisma';

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
  price: bigint;
  rank: number;
  builderPoints: number;
};

export type BuilderInfo = BasicUserInfo &
  BuilderMetrics & {
    builderStatus: BuilderStatus;
    nftImageUrl?: string | null;
    nftsSoldToScout?: number;
  };
