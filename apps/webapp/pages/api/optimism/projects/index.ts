import { prisma } from '@charmverse/core/prisma-client';
import { storeProjectMetadataAndPublishOptimismAttestation } from '@packages/connect-shared/lib/attestations/storeProjectMetadataAndPublishOptimismAttestation';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { createProject } from '@packages/lib/optimism/createProject';
import type { OptimismProjectAttestationContent } from '@packages/lib/optimism/getOpProjectsByFarcasterId';
import { getOpProjectsByFarcasterId } from '@packages/lib/optimism/getOpProjectsByFarcasterId';
import { generateOgImage } from '@packages/lib/projects/generateOgImage';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getProjectsController).post(createProjectController);

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
    return res.status(200).json([]);
  }

  const fid = user.farcasterUser.fid;

  const opProjectAttestations = await getOpProjectsByFarcasterId({ farcasterId: fid });
  return res.status(200).json(opProjectAttestations);
}

async function createProjectController(
  req: NextApiRequest,
  res: NextApiResponse<{
    title: string;
    projectRefUID: string;
  }>
) {
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

  const newProject = await createProject({
    source: 'charmverse',
    userId,
    input: req.body
  });

  const result = await storeProjectMetadataAndPublishOptimismAttestation({
    projectId: newProject.id,
    userId
  });
  if (!result) {
    throw new Error('Failed to store project metadata and publish optimism attestation');
  }

  const { projectRefUID } = result;

  await generateOgImage(newProject.id, userId);

  trackUserAction('create_optimism_project', {
    projectRefUID,
    farcasterId: user.farcasterUser.fid,
    userId
  });

  return res.status(200).json({
    title: newProject.name,
    projectRefUID
  });
}

export default withSessionRoute(handler);
