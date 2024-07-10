import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { optimism } from 'viem/chains';
import { getAddress } from 'viem/utils';

import { signAndPublishCharmverseCredential } from 'lib/credentials/attestOffchain';
import type { ExternalProjectMetadata } from 'lib/credentials/schemas/external';

import { GITCOIN_SUPPORTED_CHAINS } from './constants';
import { getProjectOwners } from './getProjectDetails';
import { getRoundApplicationsWithMeta } from './getRoundApplications';

export async function createOffchainCredentialsForProjects() {
  for (const chainId of GITCOIN_SUPPORTED_CHAINS) {
    const approvedApplications = await getRoundApplicationsWithMeta(chainId);

    log.info(`Running ${approvedApplications.length} approved applications from gitcoin, on chain ${chainId}`);

    for (const application of approvedApplications) {
      const metadata = application.metadata;
      const recepient = getAddress(metadata.recipient) as `0x${string}`;
      const owners = await getProjectOwners([recepient], chainId);
      const approvedStatusSnapshot = application.statusSnapshots?.find((s) => String(s.status) === '1');
      const approvedSnapshotDate = new Date((Number(approvedStatusSnapshot?.timestamp) || 0) * 1000).toISOString();
      const credentialDate = approvedStatusSnapshot ? approvedSnapshotDate : new Date().toISOString();
      const roundUrl = `https://explorer.gitcoin.co/#/round/${chainId}/${application.round.id}`;

      const metadataPayload: ExternalProjectMetadata = {
        name: metadata.title,
        round: metadata.roundName,
        proposalUrl: `${roundUrl}/${application.applicationIndex}`,
        website: metadata.website,
        twitter: metadata.projectTwitter,
        github: metadata.userGithub,
        proposalId: application.id
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
              source: 'gitcoin',
              metadata: metadataPayload
            }
          });

          try {
            await signAndPublishCharmverseCredential({
              credential: {
                type: 'external',
                data: {
                  Name: metadata.title,
                  ProjectId: externalProject.id,
                  Source: 'Gitcoin',
                  Event: 'Approved',
                  GrantRound: metadata.roundName,
                  Date: credentialDate,
                  GrantURL: roundUrl,
                  URL: `${roundUrl}/${application.applicationIndex}`
                }
              },
              chainId: optimism.id,
              recipient: owner
            });

            log.info(
              `External credential created for Gitcoin round application id ${application.id} and chain id ${chainId}`
            );
          } catch (err) {
            log.debug(
              `Failed to create external credential for Gitcoin round application id ${application.id} and chain id ${chainId}`
            );
          }
        }
      }
    }
  }
}
