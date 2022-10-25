
import { MemberPropertyPermissionLevel } from '@prisma/client';

import { prisma } from 'db';
import type { CreateMemberPropertyPermissionInput } from 'lib/members/interfaces';
import { InvalidInputError } from 'lib/utilities/errors';

export async function createMemberPropertyPermission (data: CreateMemberPropertyPermissionInput) {
  const space = await prisma.space.findFirst({
    where: {
      memberProperty: {
        some: {
          id: data.memberPropertyId
        }
      },
      roles: {
        some: {
          id: data.roleId
        }
      }
    }
  });

  if (!space) {
    throw new InvalidInputError('Member property and role must be in the same workspace');
  }

  return prisma.memberPropertyPermission.create({
    data: {
      ...data,
      // we only have view permission for now
      memberPropertyPermissionLevel: MemberPropertyPermissionLevel.view
    },
    include: {
      role: {
        select: { name: true }
      }
    }
  });
}
