import type { InviteLink, PublicInviteLinkContext } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

export type InviteLinkInput = {
  spaceId: string;
  createdBy: string;
  maxAgeMinutes?: number;
  maxUses?: number;
  visibleOn?: PublicInviteLinkContext;
};

export async function createInviteLink({
  maxAgeMinutes,
  maxUses,
  spaceId,
  createdBy,
  visibleOn
}: InviteLinkInput): Promise<InviteLink> {
  const link = await prisma.inviteLink.create({
    data: {
      code: uuid().substring(0, 6),
      createdBy,
      // Links with a public context have unlimited uses and do not expire
      maxAgeMinutes: visibleOn ? -1 : maxAgeMinutes,
      maxUses: visibleOn ? -1 : maxUses,
      spaceId,
      visibleOn
    }
  });
  return link;
}
