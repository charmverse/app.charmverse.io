import { gql } from '@apollo/client';
import type { CharmProjectCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import { arrayUtils } from '@packages/core/utilities';

import { attestOnchain } from '../attestOnchain';
import type { EasSchemaChain } from '../connectors';
import { easGraphQlClients } from '../external/easGraphQlClients';
import { charmProjectSchemaId, decodeCharmProject } from '../schemas/charmProject';
import { storeProjectInS3 } from '../storeProjectInS3';

import { issueUserIdentifierIfNecessary } from './issueUserIdentifier';

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

  const allTeamMembers = await prisma.charmProjectCredential.findMany({
    where: {
      projectId: project.id
    },
    select: {
      user: {
        select: {
          id: true,
          charmCredentials: true
        }
      }
    }
  });

  let teamIdentifiers = [authorRefUID];

  for (const teamMember of allTeamMembers) {
    let identifierAttestationUID = teamMember.user.charmCredentials[0]?.attestationUID;

    if (!identifierAttestationUID) {
      identifierAttestationUID = await issueUserIdentifierIfNecessary({ chainId, userId: teamMember.user.id }).then(
        (val) => val.attestationUID
      );
    }

    teamIdentifiers.push(identifierAttestationUID);
  }

  teamIdentifiers = arrayUtils.uniqueValues(teamIdentifiers);

  const { staticFilePath, mappedProject } = await storeProjectInS3({
    storageFormat: 'charmverse',
    projectId: project.id,
    extraData: {
      connectUserUIDs: allTeamMembers
    }
  });

  let projectRefUID =
    project.charmProjectCredentials[0]?.projectRefUID ??
    (await easGraphQlClients[chainId]
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
        return null;
      }));

  if (!projectRefUID) {
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
  }

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
      chainId,
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
