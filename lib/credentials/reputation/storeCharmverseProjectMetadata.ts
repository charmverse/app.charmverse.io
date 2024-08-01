import type { CharmProjectCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { optimism } from 'viem/chains';

import { attestOnchain } from '../attestOnchain';
import type { EasSchemaChain } from '../connectors';
import { storeProjectInS3 } from '../storeProjectInS3';

import { issueUserIdentifierIfNecessary } from './issueUserIdentifier';

export async function storeCharmverseProjectMetadata({
  projectId,
  chainId
}: {
  projectId: string;
  chainId: EasSchemaChain;
}): Promise<CharmProjectCredential> {
  const project = await prisma.project.findUniqueOrThrow({
    where: {
      id: projectId
    },
    select: {
      id: true,
      name: true,
      createdBy: true,
      charmProjectCredentials: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    }
  });

  const authorRefUID = await issueUserIdentifierIfNecessary({ chainId, userId: project.createdBy }).then(
    (identifier) => identifier.attestationUID
  );

  const { staticFilePath, mappedProject } = await storeProjectInS3({
    storageFormat: 'charmverse',
    projectOrProjectId: project.id
  });

  const projectRefUID =
    project.charmProjectCredentials[0].projectRefUID ??
    (await attestOnchain({
      chainId,
      credentialInputs: {
        recipient: null,
        data: {
          authorRefUID,
          uid: project.id
        }
      },
      type: 'charmProject'
    }));

  const projectSnapshotRefUID =
    project.charmProjectCredentials[0].metadataAttestationUID ??
    (await attestOnchain({
      chainId,
      credentialInputs: {
        recipient: null,
        data: {
          projectRefUID,
          metadataURL: staticFilePath,
          name: project.name
        }
      },
      type: 'charmProjectMetadata'
    }));

  const savedSnapshot = await prisma.charmProjectCredential.upsert({
    where: {
      projectRefUID
    },
    create: {
      projectRefUID,
      name: project.name,
      metadataUrl: staticFilePath,
      metadataAttestationUID: projectSnapshotRefUID,
      user: {
        connect: {
          id: project.createdBy
        }
      },
      metadata: mappedProject,
      chainId: optimism.id,
      project: {
        connect: {
          id: project.id
        }
      }
    },
    update: {
      name: project.name,
      metadataUrl: staticFilePath,
      metadata: mappedProject
    }
  });

  return savedSnapshot;
}
