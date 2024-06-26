import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { OPProjectData } from 'lib/optimism/getOpProjects';
import { getOpProjectsByFarcasterId } from 'lib/optimism/getOpProjectsByFarcasterId';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utils/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getProjectsController);

async function getProjectsController(req: NextApiRequest, res: NextApiResponse<OPProjectData[]>) {
  const userId = req.session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      farcasterUser: {
        select: {
          fid: true
        }
      }
    }
  });

  if (!user || !user.farcasterUser) {
    throw new InvalidInputError('User does not have a farcaster account.');
  }

  const fid = user.farcasterUser.fid;

  const opProjects = await getOpProjectsByFarcasterId({ farcasterId: fid });
  return res.status(200).json(opProjects);
}

export default withSessionRoute(handler);
