import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import { isSpaceDiscordAdmin } from 'lib/discord/discordSpaceAdmin';

type AddUserToSpaceProps = {
  spaceRole: Prisma.XOR<Prisma.SpaceRoleCreateInput, Prisma.SpaceRoleUncheckedCreateInput>;
  spaceId?:string;
  userId?: string;
}

export async function addUserToSpace ({ spaceRole, spaceId, userId }: AddUserToSpaceProps) {
  let isAdmin = spaceRole.isAdmin;

  if (!isAdmin && spaceId && userId) {
    // try to grant admin for discord admin user
    isAdmin = await isSpaceDiscordAdmin({ userId, spaceId });
  }

  return prisma.spaceRole.create({
    data: {
      ...spaceRole,
      isAdmin
    }
  });
}
