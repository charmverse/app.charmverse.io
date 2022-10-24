
import { MemberPropertyPermissionLevel } from '@prisma/client';

import { prisma } from 'db';
import type { CreateMemberPropertyPermissionInput } from 'lib/members/interfaces';

export function createMemberPropertyPermission (data: CreateMemberPropertyPermissionInput) {
  return prisma.memberPropertyPermission.create({
    data: {
      ...data,
      // we only have view permission for now
      memberPropertyPermissionLevel: MemberPropertyPermissionLevel.view
    }
  });
}
