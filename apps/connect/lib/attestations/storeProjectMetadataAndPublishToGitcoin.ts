import { DataNotFoundError } from '@charmverse/core/errors';
import type { GitcoinProjectAttestation } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { optimismSepolia } from 'viem/chains';

import { awsS3Bucket } from 'config/constants';
import { uploadFileToS3 } from 'lib/aws/uploadToS3Server';
import { attestOnchain } from 'lib/credentials/attestOnchain';
import { gitcoinProjectCredentialSchemaId } from 'lib/credentials/schemas/gitcoinProjectSchema';
import { getFarcasterProfile } from 'lib/farcaster/getFarcasterProfile';

import { fetchProject } from '../actions/fetchProject';

import { mapProjectToGitcoin } from './mapProjectToGitcoin';

export async function storeProjectMetadataAndPublishToGitcoin({
  userId,
  projectId
}: {
  userId: string;
  projectId: string;
}): Promise<GitcoinProjectAttestation> {
  const farcasterUser = await prisma.farcasterUser.findUniqueOrThrow({
    where: {
      userId
    },
    select: {
      account: true,
      fid: true
    }
  });

  const project = await fetchProject(projectId);

  if (!project) {
    throw new DataNotFoundError('Project not found');
  }

  const fcProfile = await getFarcasterProfile({
    fid: farcasterUser.fid
  });

  if (!fcProfile) {
    throw new DataNotFoundError('Farcaster profile not found');
  }

  const filePath = `connect/projects/${project.id}/project.json`;

  const projectInGitcoinFormat = mapProjectToGitcoin({ project });

  await uploadFileToS3({
    pathInS3: filePath,
    content: Buffer.from(JSON.stringify(projectInGitcoinFormat)),
    contentType: 'application/json'
  });

  const chainId = optimismSepolia.id;

  const attestationUID = await attestOnchain({
    type: 'gitcoinProject',
    chainId,
    credentialInputs: {
      recipient: fcProfile.connectedAddress ?? fcProfile.connectedAddresses[0] ?? fcProfile.body.address,
      data: {
        name: project.name,
        metadataPtr: `https://s3.amazonaws.com/${awsS3Bucket}/${filePath}`,
        metadataType: 1,
        type: 'gitcoinProject',
        round: '1'
      }
    }
  });

  const storedAttestation = await prisma.gitcoinProjectAttestation.create({
    data: {
      project: { connect: { id: project.id } },
      attestationUID,
      chainId,
      schemaId: gitcoinProjectCredentialSchemaId
    }
  });

  return storedAttestation;
}
