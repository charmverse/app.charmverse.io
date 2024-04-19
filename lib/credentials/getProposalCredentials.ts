import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { IssuedCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { EasSchemaChain } from './connectors';
import { getOnchainCredentialsById, type EASAttestationFromApi } from './external/getOnchainCredentials';
import { getCharmverseOffchainCredentialsByIds, getParsedCredential } from './queriesAndMutations';

export async function getProposalCredentials({ proposalId }: { proposalId: string }): Promise<EASAttestationFromApi[]> {
  if (!proposalId) {
    throw new InvalidInputError('proposaliD is required');
  }
  const issuedCredentials = await prisma.issuedCredential
    .findMany({
      where: {
        proposalId
      }
    })
    .then((data) =>
      data.reduce(
        (acc, val) => {
          if (val.onchainAttestationId) {
            acc.onchain.push(val);
          } else if (val.ceramicId) {
            acc.offchain.push(val);
          }
          return acc;
        },
        { offchain: [], onchain: [] } as { offchain: IssuedCredential[]; onchain: IssuedCredential[] }
      )
    );

  const offchainData = await getCharmverseOffchainCredentialsByIds({
    ceramicIds: issuedCredentials.offchain.map((offchain) => offchain.ceramicId as string)
  }).catch((err) => {
    log.error('Error fetching offchain credentials', err);

    return issuedCredentials.offchain
      .map((offchain) => (offchain.ceramicRecord ? getParsedCredential(offchain.ceramicRecord as any) : null))
      .filter(Boolean) as EASAttestationFromApi[];
  });

  const onChainData = await getOnchainCredentialsById({
    attestations: issuedCredentials.onchain.map((c) => ({
      chainId: c.onchainChainId as EasSchemaChain,
      id: c.onchainAttestationId as string
    }))
  });

  return [...onChainData, ...offchainData];
}
