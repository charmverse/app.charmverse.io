import { MemberPropertyPermissionLevel } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';
import type { CreateMemberPropertyPermissionInput } from '@root/lib/members/interfaces';

export async function createMemberPropertyPermission(data: CreateMemberPropertyPermissionInput) {
  const space = await prisma.space.findFirst({
    where: {
      memberProperties: {
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
    throw new InvalidInputError('Member property and role must be in the same space');
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
