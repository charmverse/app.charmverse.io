import type { OptimismProjectAttestation } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { storeProjectMetadataAndPublishOptimismAttestation } from '@connect-shared/lib/attestations/storeProjectMetadataAndPublishOptimismAttestation';
import { createOptimismProject } from '@connect-shared/lib/projects/createOptimismProject';
import { generateOgImage } from '@connect-shared/lib/projects/generateOgImage';
import { trackUserAction } from '@root/lib/metrics/mixpanel/trackUserAction';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { getOpProjectsByFarcasterId } from 'lib/optimism/getOpProjectsByFarcasterId';
import type { OptimismProjectMetadata } from 'lib/optimism/storeOptimismProjectAttestations';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utils/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getProjectsController).post(createProjectController);

export type OptimismProjectAttestationContent = Omit<OptimismProjectAttestation, 'metadata'> & {
  metadata: OptimismProjectMetadata;
  teamMembers: {
    username: string;
    name: string;
    avatar: string;
    fid: number;
  }[];
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

  const newProject = await createOptimismProject({
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
