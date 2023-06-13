import { DataNotFoundError } from '@charmverse/core/errors';
import type { PublicInviteLinkContext } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { InviteLinkPopulated } from 'lib/invites/getInviteLink';
import { getPublicInviteLink } from 'lib/invites/getPublicInviteLink';
import { validateInviteLink } from 'lib/invites/validateInviteLink';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

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
