import { log } from '@charmverse/core/log';
import type { MemberPropertyValue } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { paginatedPrismaTask } from '@packages/lib/utils/paginatedPrismaTask';
import _sum from 'lodash/sum';

import type { BlocksCountQuery, GenericBlocksCount } from './interfaces';

export type MemberPropertyCountDetails = {
  memberProperties: number;
  memberPropertyValues: number;
};

export type MemberPropertyCounts = GenericBlocksCount<MemberPropertyCountDetails>;

export async function countMemberProperties({ spaceId }: BlocksCountQuery): Promise<MemberPropertyCounts> {
  const memberPropertyCounts: MemberPropertyCounts = {
    total: 0,
    details: {
      memberProperties: 0,
      memberPropertyValues: 0
    }
  };

  memberPropertyCounts.details.memberProperties = await prisma.memberProperty.count({
    where: {
      spaceId
    }
  });

  const memberPropertyValues = await paginatedPrismaTask({
    model: 'memberPropertyValue',
    queryOptions: {
      where: {
        spaceId,
        user: {
          spaceRoles: {
            some: {
              spaceId
            }
          }
        }
      },
      select: {
        id: true,
        value: true
      }
    },
    mapper: ({ value, id }: Pick<MemberPropertyValue, 'value' | 'id'>) => {
      try {
        if ((!value && value !== 0) || (Array.isArray(value) && value.length === 0)) {
          return 0;
        }
      } catch (err) {
        log.error('Error evaluating member property value', { memberPropertyValueId: id });
        return 0;
      }
      return 1;
    },
    onSuccess: _sum
  });

  memberPropertyCounts.details.memberPropertyValues = memberPropertyValues;

  memberPropertyCounts.total = _sum(Object.values(memberPropertyCounts.details));

  return memberPropertyCounts;
}
