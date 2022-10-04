import type { InviteLink, Space } from '@prisma/client';
import { v4 as uuid } from 'uuid';

import { prisma } from 'db';

export type InviteLinkPopulated = InviteLink & { space: Space };

export async function getInviteLink (code: string): Promise<{ invite?: InviteLinkPopulated, expired?: boolean }> {

  const invite = await prisma.inviteLink.findUnique({
    where: {
      code
    },
    include: {
      space: true
    }
  });
  if (!invite) {
    return {};
  }
  if (invite.maxUses > 0 && invite.useCount >= invite.maxUses) {
    return { invite, expired: true };
  }
  else if (invite.maxAgeMinutes > 0) {
    const timePassed = Date.now() - invite.createdAt.getTime();
    const expired = timePassed > invite.maxAgeMinutes * 60 * 1000;
    return { invite, expired };
  }
  else {
    return { invite, expired: false };
  }
}

interface InviteLinkInput {
  spaceId: string;
  createdBy: string;
  maxAgeMinutes?: number;
  maxUses?: number;
}

export async function createInviteLink ({ maxAgeMinutes, maxUses, spaceId, createdBy }: InviteLinkInput) {
  const link = await prisma.inviteLink.create({
    data: {
      code: uuid().substring(0, 6),
      createdBy,
      maxAgeMinutes,
      maxUses,
      spaceId
    }
  });
  return link;
}

export function acceptInviteLink () {

}

export async function deleteInviteLink (id: string) {
  await prisma.inviteLink.delete({
    where: {
      id
    }
  });
}

export function parseUrl (url: string): string | undefined {
  let inviteId: string | undefined;
  try {
    inviteId = new URL(url).pathname.split('/').pop();
  }
  catch (err) {
    //
  }
  return inviteId;
}
