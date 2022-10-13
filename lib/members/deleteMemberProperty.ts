import { prisma } from 'db';

import { DEFAULT_MEMBER_PROPERTIES } from './utils';

export function deleteMemberProperty (id: string) {
  return prisma.memberProperty.deleteMany({
    where: {
      id,
      type: {
        notIn: [...DEFAULT_MEMBER_PROPERTIES]
      }
    }
  });
}
