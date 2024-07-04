import { DataNotFoundError } from '@charmverse/core/errors';
import type { GitcoinProjectAttestation } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { attestOnchain } from 'lib/credentials/attestOnchain';
import { gitcoinProjectCredentialSchemaId } from 'lib/credentials/schemas/gitcoinProjectSchema';
import { getFarcasterProfile } from 'lib/farcaster/getFarcasterProfile';

import { fetchProject } from '../actions/fetchProject';

import { projectAttestationChainId } from './constants';
import { storeGitcoinProjectProfileInS3 } from './storeGitcoinProjectProfileInS3';
import { storeProjectInS3 } from './storeProjectInS3';

const currentGitcoinRound = 'clxokl3hl000013trh6d4lhyo';

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

  const { staticFilePath: profileFilePath } = await storeGitcoinProjectProfileInS3({
    projectOrProjectId: project
  });

  const [projectAttestationUID, profileAttestationUID] = await Promise.all([
    attestOnchain({
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
    }),
    attestOnchain({
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
    })
  ]);

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
