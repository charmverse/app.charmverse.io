import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { IssuedCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { EasSchemaChain } from './connectors';
import { getOnchainCredentialsById, type EASAttestationFromApi } from './external/getOnchainCredentials';

export async function getProposalOrApplicationCredentials({
  proposalId,
  applicationId
}: {
  proposalId?: string;
  applicationId?: string;
}): Promise<EASAttestationFromApi[]> {
  if (!proposalId && !applicationId) {
    throw new InvalidInputError('proposalId or applicationId is required');
  }
  const issuedCredentials = await prisma.issuedCredential
    .findMany({
      where: {
        OR: [
          {
            proposalId
          },
          {
            rewardApplicationId: applicationId
          }
        ]
      }
    })
    .then((data) =>
      data.reduce(
        (acc, val) => {
          if (val.onchainAttestationId) {
            acc.onchain.push(val);
          }
          return acc;
        },
        { onchain: [] } as { onchain: IssuedCredential[] }
      )
    );

  const onChainData = await getOnchainCredentialsById({
    attestations: issuedCredentials.onchain.map((c) => ({
      chainId: c.onchainChainId as EasSchemaChain,
      id: c.onchainAttestationId as string
    }))
  });

  return [...onChainData];
}
