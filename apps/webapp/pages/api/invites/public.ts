import type { PublicInviteLinkContext } from '@charmverse/core/prisma-client';
import { DataNotFoundError } from '@packages/core/errors';
import type { InviteLinkPopulated } from '@packages/lib/invites/getInviteLink';
import { getPublicInviteLink } from '@packages/lib/invites/getPublicInviteLink';
import { validateInviteLink } from '@packages/lib/invites/validateInviteLink';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPublicInviteLinkController);

async function getPublicInviteLinkController(req: NextApiRequest, res: NextApiResponse<InviteLinkPopulated>) {
  const inviteLink = await getPublicInviteLink({
    visibleOn: req.query.visibleOn as PublicInviteLinkContext,
    spaceId: req.query.spaceId as string
  });

  const validation = await validateInviteLink({
    invite: inviteLink
  });

  if (!validation.valid) {
    throw new DataNotFoundError(`Invite link not found`);
  }

  res.status(200).send(inviteLink);
}

export default withSessionRoute(handler);
