import { DataNotFoundError } from '@charmverse/core/errors';
import type { GitcoinProjectAttestation } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { optimismSepolia } from 'viem/chains';

import { attestOnchain } from 'lib/credentials/attestOnchain';
import { gitcoinProjectCredentialSchemaId } from 'lib/credentials/schemas/gitcoinProjectSchema';
import { getFarcasterProfile } from 'lib/farcaster/getFarcasterProfile';

import { fetchProject } from '../actions/fetchProject';

import { storeProjectInS3 } from './storeProjectInS3';

export async function storeProjectMetadataAndPublishGitcoinAttestation({
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
  const { staticFilePath } = await storeProjectInS3({
    projectOrProjectId: project,
    storageFormat: 'gitcoin'
  });

  const chainId = optimismSepolia.id;

  const attestationUID = await attestOnchain({
    type: 'gitcoinProject',
    chainId,
    credentialInputs: {
      recipient: fcProfile.connectedAddress ?? fcProfile.connectedAddresses[0] ?? fcProfile.body.address,
      data: {
        name: project.name,
        metadataPtr: staticFilePath,
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
