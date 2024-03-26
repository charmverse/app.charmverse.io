import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getAddress } from 'viem';

import { signAndPublishCharmverseCredential } from 'lib/credentials/attestOffchain';

import { GITCOIN_SUPPORTED_CHAINS } from './constants';
import { getProjectOwners } from './getProjectDetails';
import { getRoundApplicationsWithMeta } from './getRoundApplications';

// Approved projects
export async function createOffchainCredentialsForProjects() {
  for (const chainId of GITCOIN_SUPPORTED_CHAINS) {
    const approvedApplications = await getRoundApplicationsWithMeta(chainId);

    for (const application of approvedApplications) {
      const metadata = application.metadata;
      const recepient = getAddress(metadata.application.recipient);
      const owners = await getProjectOwners([recepient], chainId);
      const approvedStatusSnapshot = application.statusSnapshots?.find((s) => String(s.status) === '1');
      const approvedSnapshotDate = new Date((Number(approvedStatusSnapshot?.timestamp) || 0) * 1000).toISOString();
      const credentialDate = approvedStatusSnapshot ? approvedSnapshotDate : new Date().toISOString();
      const roundUrl = `https://explorer.gitcoin.co/#/round/${chainId}/${application.round.id}`;

      const metadataPayload = {
        name: metadata.application.project.title,
        round: metadata.round.name,
        proposalUrl: `${roundUrl}/${application.applicationIndex}`,
        website: metadata.application.project.website,
        twitter: metadata.application.project.projectTwitter,
        github: metadata.application.project.userGithub,
        applicationId: application.id
      };

      for (const owner of owners) {
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
                Name: metadata.application.project.title,
                ProjectId: externalProject.id,
                Source: 'Gitcoin',
                Event: 'Approved',
                GrantRound: metadata.round.name,
                Date: credentialDate,
                GrantURL: roundUrl,
                URL: `${roundUrl}/${application.applicationIndex}`
              }
            },
            chainId: 10,
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
