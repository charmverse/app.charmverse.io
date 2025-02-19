import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { createProjectMetadataAttestation } from '@packages/connect-shared/lib/attestations/agoraApi';
import { getAttestation } from '@root/lib/credentials/getAttestation';
import { decodeOptimismProjectAttestation } from '@root/lib/credentials/schemas/optimismProjectUtils';
import { trackUserAction } from '@root/lib/metrics/mixpanel/trackUserAction';
import type { OptimismProjectMetadata } from '@root/lib/optimism/storeOptimismProjectAttestations';
import { withSessionRoute } from '@root/lib/session/withSession';
import { UnauthorisedActionError } from '@root/lib/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { optimism } from 'viem/chains';

import { onError, onNoMatch } from 'lib/middleware';
import { editProject } from 'lib/optimism/editProject';
import { getOpProjectsByAttestationId } from 'lib/optimism/getOpProjectsByAttestationId';
import type { OptimismProjectAttestationContent } from 'lib/optimism/getOpProjectsByFarcasterId';
import type { FormValues, ProjectCategory } from 'lib/optimism/projectSchema';
import { generateOgImage } from 'lib/projects/generateOgImage';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProjectByAttestationIdController).put(updateProjectController);

async function getProjectByAttestationIdController(
  req: NextApiRequest,
  res: NextApiResponse<OptimismProjectAttestationContent | null>
) {
  const attestationId = req.query.attestationId as string;
  const opProjectAttestation = await getOpProjectsByAttestationId({ projectRefUID: attestationId });
  return res.status(200).json(opProjectAttestation);
}

async function updateProjectController(req: NextApiRequest, res: NextApiResponse) {
  const attestationId = req.query.attestationId as string;
  const userId = req.session.user.id;
  const optimismProjectValues = req.body as FormValues;

  const optimismProjectAttestation = await prisma.optimismProjectAttestation.findUniqueOrThrow({
    where: {
      projectRefUID: attestationId
    },
    select: {
      metadata: true,
      projectId: true,
      metadataAttestationUID: true
    }
  });
  const farcasterUser = await prisma.farcasterUser.findUniqueOrThrow({
    where: {
      userId
    },
    select: {
      fid: true
    }
  });

  const projectAttestationData = await getAttestation({
    attestationUID: attestationId,
    chainId: optimism.id
  }).then((data) => decodeOptimismProjectAttestation(data.data));

  if (!projectAttestationData || projectAttestationData.farcasterID !== farcasterUser.fid) {
    throw new UnauthorisedActionError('User does not have permission to update this project');
  }

  if (optimismProjectAttestation.projectId) {
    await editProject({
      userId,
      input: {
        projectId: optimismProjectAttestation.projectId,
        ...optimismProjectValues,
        description: optimismProjectValues.description || '',
        optimismCategory: optimismProjectValues.optimismCategory as ProjectCategory
      }
    });
    await generateOgImage(optimismProjectAttestation.projectId, userId);
  }

  const optimismProjectMetadata = optimismProjectAttestation.metadata as OptimismProjectMetadata;

  const newProjectMetadata = {
    ...optimismProjectMetadata,
    name: optimismProjectValues.name || optimismProjectMetadata.name,
    description: optimismProjectValues.description || optimismProjectMetadata.description,
    projectAvatarUrl: optimismProjectValues.avatar || optimismProjectMetadata.projectAvatarUrl,
    projectCoverImageUrl: optimismProjectValues.coverImage || optimismProjectMetadata.projectCoverImageUrl,
    category: optimismProjectValues.optimismCategory || optimismProjectMetadata.category,
    socialLinks: {
      twitter: optimismProjectValues.twitter || optimismProjectMetadata.socialLinks.twitter,
      website: optimismProjectValues.websites || optimismProjectMetadata.socialLinks.website,
      farcaster: optimismProjectValues.farcasterValues || optimismProjectMetadata.socialLinks.farcaster,
      mirror: optimismProjectValues.mirror || optimismProjectMetadata.socialLinks.mirror
    },
    team: optimismProjectValues.projectMembers.map((member) => member.farcasterId.toString()),
    github: optimismProjectValues.github ? [optimismProjectValues.github] : optimismProjectMetadata.github
  } as Prisma.InputJsonValue;

  await createProjectMetadataAttestation({
    farcasterId: farcasterUser.fid,
    farcasterIds: optimismProjectValues.projectMembers.map((member) => member.farcasterId),
    projectMetadata: newProjectMetadata,
    projectRefUID: attestationId,
    projectId: optimismProjectAttestation.projectId
  });

  trackUserAction('update_optimism_project', {
    projectRefUID: attestationId,
    userId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
