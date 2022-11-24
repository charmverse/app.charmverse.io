import type { Prisma } from '@prisma/client';

import { prisma } from 'db';

type AddUserToSpaceProps = {
  spaceRole: Prisma.XOR<Prisma.SpaceRoleCreateInput, Prisma.SpaceRoleUncheckedCreateInput>;
  spaceId?:string;
  userId?: string;
}

export async function addUserToSpace ({ spaceRole }: AddUserToSpaceProps) {
  return prisma.spaceRole.create({
    data: {
      ...spaceRole
    }
  });
}
