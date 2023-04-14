import { prisma } from '@charmverse/core';
import type { Feature, Space } from '@prisma/client';

export type SpaceHiddenFeatures = {
  spaceId: string;
  hiddenFeatures: Feature[];
};

export function setHiddenFeatures({ hiddenFeatures, spaceId }: SpaceHiddenFeatures): Promise<Space> {
  return prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      hiddenFeatures
    }
  });
}
