import { prisma } from '@charmverse/core';

import { DEFAULT_MEMBER_PROPERTIES } from 'lib/members/constants';

export function deleteMemberProperty(id: string) {
  return prisma.memberProperty.deleteMany({
    where: {
      id,
      type: {
        notIn: DEFAULT_MEMBER_PROPERTIES
      }
    }
  });
}
