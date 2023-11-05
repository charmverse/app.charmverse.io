import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteInvite);

async function deleteInvite(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const existingInvite = await prisma.inviteLink.findUnique({
    where: {
      id: id as string
    }
  });

  if (!existingInvite) {
    throw new DataNotFoundError(`Invite with id ${id} not found`);
  }

  const { error } = await hasAccessToSpace({
    spaceId: existingInvite.spaceId,
    userId: req.session.user.id,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  await prisma.inviteLink.delete({
    where: {
      id: req.query.id as string
    }
  });

  trackUserAction('delete_invite_link', {
    userId: req.session.user.id,
    spaceId: existingInvite.spaceId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
