import type { GitcoinProjectAttestation } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { resolveENSName } from '@packages/blockchain/getENSName';
import { DataNotFoundError } from '@packages/core/errors';
import { log } from '@packages/core/log';
import { attestOnchain } from '@packages/credentials/attestOnchain';
import { gitcoinProjectCredentialSchemaId } from '@packages/credentials/schemas/gitcoinProjectSchema';
import { storeProjectInS3 } from '@packages/credentials/storeProjectInS3';
import { getFarcasterProfile } from '@packages/farcaster/getFarcasterProfile';
import { isAddress } from 'viem';

import { gitcoinProjectAttestationChainId } from './constants';
import { storeGitcoinProjectProfileInS3 } from './storeGitcoinProjectProfileInS3';

const currentGitcoinRound = 'cm0ayus350005zwyb4vtureu1';

export async function storeProjectMetadataAndPublishGitcoinAttestation({
  userId,
  projectId
}: {
  userId: string;
  projectId: string;
}): Promise<GitcoinProjectAttestation> {
  const attestationRecipient = await getUserWallet(userId);

  const project = await prisma.project.findFirstOrThrow({
    where: { id: projectId },
    select: { id: true, name: true }
  });

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
      chainId: gitcoinProjectAttestationChainId
    }
  });

  const existingProjectAttestation = existingAttestations.find((a) => a.type === 'application');
  const existingProfileAttestation = existingAttestations.find((a) => a.type === 'profile');

  if (!existingProfileAttestation) {
    const profileAttestationUID: string = await attestOnchain({
      type: 'gitcoinProject',
      chainId: gitcoinProjectAttestationChainId,
      credentialInputs: {
        recipient: attestationRecipient.walletAddress,
        data: {
          name: attestationRecipient.username,
          metadataPtr: profileFilePath,
          metadataType: 0,
          type: 'profile',
          round: currentGitcoinRound,
          uuid: project.id
        }
      }
    });

    log.info(`New Gitcoin Profile attestation UID: ${profileAttestationUID}`);

    await prisma.gitcoinProjectAttestation.create({
      data: {
        project: { connect: { id: project.id } },
        attestationUID: profileAttestationUID,
        chainId: gitcoinProjectAttestationChainId,
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
    chainId: gitcoinProjectAttestationChainId,
    credentialInputs: {
      recipient: attestationRecipient.walletAddress,
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

  log.info(`New Gitcoin Project attestation UID: ${projectAttestationUID}`);

  return prisma.gitcoinProjectAttestation.create({
    data: {
      project: { connect: { id: project.id } },
      attestationUID: projectAttestationUID,
      chainId: gitcoinProjectAttestationChainId,
      schemaId: gitcoinProjectCredentialSchemaId,
      type: 'application'
    }
  });
}

async function getUserWallet(userId: string) {
  const { username, farcasterUser, wallets } = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      username: true,
      farcasterUser: true,
      wallets: true
    }
  });

  let walletAddress: string | null = null;

  // get wallet from farcaster profile
  if (farcasterUser) {
    const fcProfile = await getFarcasterProfile({
      fid: farcasterUser.fid
    });

    if (!fcProfile) {
      throw new DataNotFoundError('Farcaster profile not found');
    }

    walletAddress = fcProfile.connectedAddress;

    if ((walletAddress && !isAddress(walletAddress)) || !walletAddress) {
      if (walletAddress?.endsWith('.eth')) {
        const resolvedAddress = await resolveENSName(walletAddress).catch(() => null);

        if (resolvedAddress) {
          walletAddress = resolvedAddress;
        }
      }

      if (!walletAddress) {
        walletAddress = fcProfile.connectedAddresses[0];
      }
    }
    if ((walletAddress && !isAddress(walletAddress)) || !walletAddress) {
      if (walletAddress?.endsWith('.eth')) {
        const resolvedAddress = await resolveENSName(walletAddress).catch(() => null);

        if (resolvedAddress) {
          walletAddress = resolvedAddress;
        }
      }

      if (!walletAddress) {
        walletAddress = fcProfile.body.address;
      }
    }

    if (walletAddress && !isAddress(walletAddress)) {
      walletAddress = null;
    }
  }
  // from user's connected wallets
  else if (wallets.length) {
    walletAddress = wallets[0].address;
  }
  return {
    username,
    walletAddress
  };
}
