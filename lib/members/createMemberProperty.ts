import type { Prisma } from '@prisma/client';

import { prisma } from 'db';

export function createMemberProperty (data: Prisma.MemberPropertyCreateInput) {
  return prisma.memberProperty.create({ data });
}
