import { gql } from '@apollo/client';
import { log } from '@charmverse/core/log';
import type { CharmProjectCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { optimism } from 'viem/chains';

import { attestOnchain } from '../attestOnchain';
import type { EasSchemaChain } from '../connectors';
import { charmverseProjectDataChainId } from '../constants';
import { easGraphQlClients } from '../external/easGraphQlClients';
import { charmProjectSchemaId, decodeCharmProject } from '../schemas/charmProject';
import { storeProjectInS3 } from '../storeProjectInS3';

import { issueUserIdentifierIfNecessary } from './issueUserIdentifier';

const graphQlClient = easGraphQlClients[charmverseProjectDataChainId];

// Utility query for fetching last 100 credentials
const GET_CREDENTIALS = gql`
  query ($where: AttestationWhereInput) {
    attestations(where: $where, orderBy: { timeCreated: desc }, take: 100) {
      id
      data
    }
  }
`;

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

  let projectRefUID =
    project.charmProjectCredentials[0]?.projectRefUID ??
    graphQlClient
      .query({
        query: GET_CREDENTIALS,
        variables: {
          where: {
            schemaId: {
              equals: charmProjectSchemaId
            }
          }
        }
      })
      .then((result) => {
        return (result.data.attestations as { id: string; data: string }[]).find(
          (item) => decodeCharmProject(item.data).uid === project.id
        )?.id;
      })
      .catch((err) => {
        log.error('Error fetching CharmVerse project credential', { err });
      });

  if (!projectRefUID)
    projectRefUID = await attestOnchain({
      chainId,
      credentialInputs: {
        recipient: null,
        data: {
          authorRefUID,
          uid: project.id
        }
      },
      type: 'charmProject'
    });

  const projectSnapshotRefUID =
    project.charmProjectCredentials[0]?.metadataAttestationUID ??
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
