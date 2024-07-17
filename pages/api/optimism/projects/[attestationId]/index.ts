import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { createProjectMetadataAttestation } from '@connect-shared/lib/attestations/agoraApi';
import { editOptimismProject } from '@connect-shared/lib/projects/editOptimismProject';
import { generateOgImage } from '@connect-shared/lib/projects/generateOgImage';
import { GET } from '@root/adapters/http';
import { getAttestation } from '@root/lib/credentials/getAttestation';
import {
  decodeOptimismProjectAttestation,
  decodeOptimismProjectSnapshotAttestation
} from '@root/lib/credentials/schemas/optimismProjectSchemas';
import type { OptimismProjectMetadata } from '@root/lib/optimism/storeOptimismProjectAttestations';
import { withSessionRoute } from '@root/lib/session/withSession';
import { UnauthorisedActionError } from '@root/lib/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { optimism } from 'viem/chains';

import type { OptimismProjectFormValues } from 'components/common/form/fields/Optimism/optimismProjectFormValues';
import { onError, onNoMatch } from 'lib/middleware';
import { getOpProjectsByAttestationId } from 'lib/optimism/getOpProjectsByAttestationId';

import type { OptimismProjectAttestationContent } from '..';

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
  const optimismProjectValues = req.body as OptimismProjectFormValues;

  const optimismProjectAttestation = await prisma.optimismProjectAttestation.findUniqueOrThrow({
    where: {
      projectRefUID: attestationId
    },
    select: {
      projectId: true,
      metadataAttestationUID: true
    }
  });
  const farcasterUser = await prisma.farcasterUser.findUniqueOrThrow({
    where: {
      userId: req.session.user.id
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
    await editOptimismProject({
      userId: req.session.user.id,
      input: {
        projectId: optimismProjectAttestation.projectId,
        ...optimismProjectValues
      }
    });
    await generateOgImage(optimismProjectAttestation.projectId, req.session.user.id);
  }

  const projectMetadataAttestationData = await getAttestation({
    attestationUID: optimismProjectAttestation.metadataAttestationUID,
    chainId: optimism.id
  }).then((data) => decodeOptimismProjectSnapshotAttestation(data.data));

  const optimismProjectMetadata = await GET<OptimismProjectMetadata>(projectMetadataAttestationData.metadataUrl);

  const newProjectMetadata = {
    ...optimismProjectMetadata,
    name: optimismProjectValues.name || optimismProjectMetadata.name,
    description: optimismProjectValues.description || optimismProjectMetadata.description,
    projectAvatarUrl: optimismProjectValues.avatar || optimismProjectMetadata.projectAvatarUrl,
    projectCoverImageUrl: optimismProjectValues.coverImage || optimismProjectMetadata.projectCoverImageUrl,
    category: optimismProjectValues.category || optimismProjectMetadata.category,
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

  return res.status(200).end();
}

export default withSessionRoute(handler);
