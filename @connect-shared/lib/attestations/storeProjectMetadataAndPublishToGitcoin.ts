import { DataNotFoundError } from '@charmverse/core/errors';
import type { GitcoinProjectAttestation } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { attestOnchain } from '@root/lib/credentials/attestOnchain';
import { gitcoinProjectCredentialSchemaId } from '@root/lib/credentials/schemas/gitcoinProjectSchema';
import { getFarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';

import { storeProjectInS3 } from '../../../lib/credentials/storeProjectInS3';
import { findProject } from '../projects/findProject';

import { projectAttestationChainId } from './constants';
import { storeGitcoinProjectProfileInS3 } from './storeGitcoinProjectProfileInS3';

const currentGitcoinRound = 'cm02ji8ui0000jcjtd3k2p01y';

export async function storeProjectMetadataAndPublishGitcoinAttestation({
  userId,
  projectIdOrPath
}: {
  userId: string;
  projectIdOrPath: string;
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

  const project = await findProject(
    stringUtils.isUUID(projectIdOrPath) ? { id: projectIdOrPath } : { path: projectIdOrPath }
  );

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

  const { staticFilePath: profileFilePath } = await storeGitcoinProjectProfileInS3({
    projectOrProjectId: project
  });

  const projectAttestationUID = await attestOnchain({
    type: 'gitcoinProject',
    chainId: projectAttestationChainId,
    credentialInputs: {
      recipient: fcProfile.connectedAddress ?? fcProfile.connectedAddresses[0] ?? fcProfile.body.address,
      data: {
        name: project.name,
        metadataPtr: staticFilePath,
        metadataType: 0,
        type: 'application',
        round: currentGitcoinRound
      }
    }
  });
  const profileAttestationUID = await attestOnchain({
    type: 'gitcoinProject',
    chainId: projectAttestationChainId,
    credentialInputs: {
      recipient: fcProfile.connectedAddress ?? fcProfile.connectedAddresses[0] ?? fcProfile.body.address,
      data: {
        name: fcProfile.body.username,
        metadataPtr: profileFilePath,
        metadataType: 0,
        type: 'profile',
        round: currentGitcoinRound
      }
    }
  });

  const [storedProjectAttestation] = await Promise.all([
    prisma.gitcoinProjectAttestation.create({
      data: {
        project: { connect: { id: project.id } },
        attestationUID: projectAttestationUID,
        chainId: projectAttestationChainId,
        schemaId: gitcoinProjectCredentialSchemaId
      }
    }),
    prisma.gitcoinProjectAttestation.create({
      data: {
        project: { connect: { id: project.id } },
        attestationUID: profileAttestationUID,
        chainId: projectAttestationChainId,
        schemaId: gitcoinProjectCredentialSchemaId
      }
    })
  ]);

  return storedProjectAttestation;
}
