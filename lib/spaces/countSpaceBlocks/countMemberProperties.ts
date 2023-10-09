import { prisma } from '@charmverse/core/prisma-client';
import _sum from 'lodash/sum';

import type { BlocksCountQuery, GenericBlocksCount } from './interfaces';

export type MemberPropertyCountDetails = {
  properties: number;
};

export type MemberPropertyCounts = GenericBlocksCount<MemberPropertyCountDetails>;

export async function countMemberProperties({ spaceId }: BlocksCountQuery): Promise<MemberPropertyCounts> {
  const memberPropertyCounts: MemberPropertyCounts = {
    total: 0,
    details: {
      properties: 0
    }
  };

  memberPropertyCounts.details.properties = await prisma.memberProperty.count({
    where: {
      spaceId
    }
  });

  memberPropertyCounts.total = _sum(Object.values(memberPropertyCounts.details));

  return memberPropertyCounts;
}
