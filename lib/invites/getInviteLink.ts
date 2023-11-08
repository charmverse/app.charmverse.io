import type { InviteLink, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { ValidatedLinkResults } from './validateInviteLink';
import { validateInviteLink } from './validateInviteLink';

export type InviteLinkPopulated = InviteLink & { space: Space };

type ValidatedLink = ValidatedLinkResults & { invite: InviteLinkPopulated };

export async function getInviteLink(code: string): Promise<ValidatedLink | null> {
  const invite = await prisma.inviteLink.findUnique({
    where: {
      code
    },
    include: {
      space: true
    }
  });
  if (!invite) {
    return null;
  }
  const { valid, reason } = validateInviteLink({ invite });
  return { valid, reason, invite };
}

export async function deleteInviteLink(id: string) {
  await prisma.inviteLink.delete({
    where: {
      id
    }
  });
}

export function parseUrl(url: string): string | undefined {
  let inviteId: string | undefined;
  try {
    inviteId = new URL(url).pathname.split('/').pop();
  } catch (err) {
    //
  }
  return inviteId;
}
