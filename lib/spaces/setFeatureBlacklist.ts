import type { Feature, Space } from '@prisma/client';

import { prisma } from 'db';

export type SpaceFeatureBlacklist = {
  spaceId: string;
  featureBlacklist: Feature[];
};

export function setFeatureBlacklist({ featureBlacklist, spaceId }: SpaceFeatureBlacklist): Promise<Space> {
  return prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      featureBlacklist
    }
  });
}
