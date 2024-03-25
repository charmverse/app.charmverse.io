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

      for (const owner of owners) {
        const credential = await signAndPublishCharmverseCredential({
          credential: {
            type: 'external',
            data: {
              Name: metadata.application.project.title,
              GrantRound: metadata.round.name,
              ProposalURL: `https://explorer.gitcoin.co/${chainId}/${application.round.id}/${application.applicationIndex}`
            }
          },
          chainId: 10,
          recipient: owner
        });

        await prisma.externalProject.create({
          data: {
            round: metadata.round.name,
            schemaId: attestationSchemaIds.external,
            recipient: credential.recipient,
            source: 'gitcoin',
            metadata
          }
        });

        log.info(
          `External credential created for Gitcoin round application id ${application.id} and chain id ${chainId}`,
          credential
        );
      }
    }
  }
}
