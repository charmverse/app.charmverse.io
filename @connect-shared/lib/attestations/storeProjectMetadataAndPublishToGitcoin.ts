import { DataNotFoundError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { GitcoinProjectAttestation } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { attestOnchain } from '@root/lib/credentials/attestOnchain';
import { gitcoinProjectCredentialSchemaId } from '@root/lib/credentials/schemas/gitcoinProjectSchema';
import { storeProjectInS3 } from '@root/lib/credentials/storeProjectInS3';
import { getFarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';

import { projectAttestationChainId } from './constants';
import { storeGitcoinProjectProfileInS3 } from './storeGitcoinProjectProfileInS3';

const currentGitcoinRound = 'cm0ayus350005zwyb4vtureu1';

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

  const project = await prisma.project.findFirstOrThrow({
    where: { id: projectId },
    select: { id: true, name: true }
  });

  const fcProfile = await getFarcasterProfile({
    fid: farcasterUser.fid
  });

  if (!fcProfile) {
    throw new DataNotFoundError('Farcaster profile not found');
  }
  const { staticFilePath } = await storeProjectInS3({
    projectId: project.id,
    storageFormat: 'gitcoin'
  });

  const { staticFilePath: profileFilePath } = await storeGitcoinProjectProfileInS3({
    projectId: project.id
  });

  const existingAttestations = await prisma.gitcoinProjectAttestation.findMany({
    where: {
      projectId: project.id,
      chainId: projectAttestationChainId
    }
  });

  const existingProjectAttestation = existingAttestations.find((a) => a.type === 'application');
  const existingProfileAttestation = existingAttestations.find((a) => a.type === 'profile');

  if (!existingProfileAttestation) {
    const profileAttestationUID: string = await attestOnchain({
      type: 'gitcoinProject',
      chainId: projectAttestationChainId,
      credentialInputs: {
        recipient: fcProfile.connectedAddress ?? fcProfile.connectedAddresses[0] ?? fcProfile.body.address,
        data: {
          name: fcProfile.body.username,
          metadataPtr: profileFilePath,
          metadataType: 0,
          type: 'profile',
          round: currentGitcoinRound,
          uuid: project.id
        }
      }
    });

    log.info('New Gitcoin Profile attestation UID:', profileAttestationUID);

    await prisma.gitcoinProjectAttestation.create({
      data: {
        project: { connect: { id: project.id } },
        attestationUID: profileAttestationUID,
        chainId: projectAttestationChainId,
        schemaId: gitcoinProjectCredentialSchemaId,
        type: 'profile'
      }
    });
  }

  if (existingProjectAttestation) {
    return existingProjectAttestation;
  }

  const projectAttestationUID: string = await attestOnchain({
    type: 'gitcoinProject',
    chainId: projectAttestationChainId,
    credentialInputs: {
      recipient: fcProfile.connectedAddress ?? fcProfile.connectedAddresses[0] ?? fcProfile.body.address,
      data: {
        name: project.name,
        metadataPtr: staticFilePath,
        metadataType: 0,
        type: 'application',
        round: currentGitcoinRound,
        uuid: project.id
      }
    }
  });

  log.info('New Gitcoin Project attestation UID:', projectAttestationUID);

  return prisma.gitcoinProjectAttestation.create({
    data: {
      project: { connect: { id: project.id } },
      attestationUID: projectAttestationUID,
      chainId: projectAttestationChainId,
      schemaId: gitcoinProjectCredentialSchemaId,
      type: 'application'
    }
  });
}
