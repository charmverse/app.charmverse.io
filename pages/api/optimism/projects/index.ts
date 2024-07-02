import type { OptimismProjectAttestation } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { getOpProjectsByFarcasterId } from 'lib/optimism/getOpProjectsByFarcasterId';
import type { OptimismProjectMetadata } from 'lib/optimism/storeOptimismProjectAttestations';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utils/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getProjectsController);

export type OptimismProjectAttestationContent = Omit<OptimismProjectAttestation, 'metadata'> & {
  metadata: OptimismProjectMetadata;
};

async function getProjectsController(req: NextApiRequest, res: NextApiResponse<OptimismProjectAttestationContent[]>) {
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

  const opProjectAttestations = await getOpProjectsByFarcasterId({ farcasterId: fid });
  return res.status(200).json(opProjectAttestations);
}

export default withSessionRoute(handler);
