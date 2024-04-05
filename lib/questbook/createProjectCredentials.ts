import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { optimism } from 'viem/chains';
import { getAddress } from 'viem/utils';

import { signAndPublishCharmverseCredential } from 'lib/credentials/attestOffchain';
import type { ExternalProjectMetadata } from 'lib/credentials/schemas/external';
import { getProjectOwners } from 'lib/gitcoin/getProjectDetails';

import { getGrantApplicationsWithMeta } from './getGrantApplications';
import { QUESTBOOK_SUPPORTED_CHAINS } from './graphql/endpoints';

export async function createOffchainCredentialsForProjects() {
  for (const chainId of QUESTBOOK_SUPPORTED_CHAINS) {
    const approvedApplications = await getGrantApplicationsWithMeta(chainId);

    log.info(`Running ${approvedApplications.length} approved applications from questbook, on chain ${chainId}`);

    for (const application of approvedApplications) {
      const recepient = getAddress(application.recipient);
      const owners = await getProjectOwners([recepient], chainId);
      const updatedAt = Number(application.date || 0) * 1000;
      const credentialDate = updatedAt ? new Date(updatedAt).toISOString() : new Date().toISOString();

      const metadataPayload: ExternalProjectMetadata = {
        name: application.projectName,
        round: application.grantTitle,
        proposalUrl: application.proposalUrl,
        proposalId: application.id,
        twitter: application.twitter,
        website: '',
        github: ''
      };

      for (const owner of owners) {
        const existingExternalProject = await prisma.externalProject.findFirst({
          where: {
            metadata: {
              path: ['proposalId'],
              equals: application.id
            }
          }
        });

        if (!existingExternalProject) {
          const externalProject = await prisma.externalProject.create({
            data: {
              recipient: owner,
              source: 'questbook',
              metadata: metadataPayload
            }
          });

          try {
            await signAndPublishCharmverseCredential({
              credential: {
                type: 'external',
                data: {
                  Name: application.projectName,
                  ProjectId: externalProject.id,
                  Source: 'Questbook',
                  Event: 'Grant Approved',
                  GrantRound: application.grantTitle,
                  Date: credentialDate,
                  GrantURL: '',
                  URL: application.proposalUrl
                }
              },
              chainId: optimism.id,
              recipient: owner
            });

            log.info(`External credential created for Questbook proposal id ${application.id} and chain id ${chainId}`);
          } catch (err) {
            log.debug(
              `Failed to create external credential for Questbook proposal id ${application.id} and chain id ${chainId}`
            );
          }
        }
      }
    }
  }
}
