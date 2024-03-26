import { prisma } from '@charmverse/core/dist/cjs/prisma-client';
import { log } from '@charmverse/core/log';
import { getAddress } from 'viem';

import { signAndPublishCharmverseCredential } from 'lib/credentials/attestOffchain';
import { attestationSchemaIds } from 'lib/credentials/schemas';

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
      const applicationEndedDate = new Date(Number(application.round.applicationsEndTime) * 1000).toISOString();

      for (const owner of owners) {
        const externalProject = await prisma.externalProject.create({
          data: {
            round: metadata.round.name,
            schemaId: attestationSchemaIds.external,
            recipient: owner,
            source: 'gitcoin',
            metadata
          }
        });

        const credential = await signAndPublishCharmverseCredential({
          credential: {
            type: 'external',
            data: {
              Name: metadata.application.project.title,
              ProjectId: externalProject.id,
              GrantRound: metadata.round.name,
              Source: 'Gitcoin',
              Event: 'Approved',
              Date: approvedStatusSnapshot ? approvedSnapshotDate : applicationEndedDate,
              GrantURL: `https://explorer.gitcoin.co/${chainId}/${application.round.id}`,
              URL: `https://explorer.gitcoin.co/${chainId}/${application.round.id}/${application.applicationIndex}`
            }
          },
          chainId: 10,
          recipient: owner
        });

        log.info(
          `External credential created for Gitcoin round application id ${application.id} and chain id ${chainId}`,
          credential
        );
      }
    }
  }
}
