import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { log } from '@charmverse/core/log';
import { chain } from 'lodash';
import { getAddress } from 'viem';
import { arbitrum, base, optimism } from 'viem/chains';

import type { EasSchemaChain } from '../connectors';
import { getOnChainAttestationUrl } from '../connectors';

import type { ExternalCredentialChain } from './schemas';
import { externalCredentialChains, trackedSchemas } from './schemas';

function getClient(url: string) {
  return new ApolloClient({
    cache: new InMemoryCache(),
    uri: url
  });
}

const graphQlClients: Record<ExternalCredentialChain, ApolloClient<any>> = {
  [optimism.id]: getClient('https://optimism.easscan.org/graphql'),
  [base.id]: getClient('https://base.easscan.org/graphql'),
  [arbitrum.id]: getClient('https://arbitrum.easscan.org/graphql')
};

/**
 * @timeCreated - Stored as seconds, normalised to milliseconds
 */
export type EASAttestationFromApi<T = any> = {
  id: string;
  content: T;
  attester: string;
  recipient: string;
  schemaId: string;
  timeCreated: number;
  chainId: ExternalCredentialChain | EasSchemaChain;
  type: 'external' | 'internal';
  verificationUrl: string;
};

const GET_EXTERNAL_CREDENTIALS = gql`
  query ($where: AttestationWhereInput) {
    attestations(where: $where) {
      id
      data
      decodedDataJson
      attester
      recipient
      schemaId
    }
  }
`;

function getTrackedOnChainCredentials({
  chainId,
  wallets
}: {
  chainId: ExternalCredentialChain;
  wallets: string[];
}): Promise<EASAttestationFromApi[]> {
  const recipient = wallets.map((w) => getAddress(w));

  const query = {
    OR: trackedSchemas[chainId].map((_schema) => ({
      schemaId: {
        equals: _schema.schemaId
      },
      attester: {
        in: _schema.issuers
      },
      recipient: { in: recipient }
    }))
  };

  return graphQlClients[chainId]
    .query({
      query: GET_EXTERNAL_CREDENTIALS,
      variables: {
        where: query
      },
      // For now, let's refetch each time and rely on http endpoint-level caching
      // https://www.apollographql.com/docs/react/data/queries/#supported-fetch-policies
      fetchPolicy: 'no-cache'
    })
    .then(({ data }) => {
      return data.attestations.map(
        (attestation: any) =>
          ({
            ...attestation,
            content: JSON.parse(attestation.decodedDataJson),
            timeCreated: attestation.timeCreated * 1000,
            verificationUrl: getOnChainAttestationUrl({ chainId, attestationId: attestation.id })
          } as EASAttestationFromApi)
      );
    });
}

export async function getAllOnChainAttestations({ wallets }: { wallets: string[] }): Promise<EASAttestationFromApi[]> {
  if (!wallets.length) {
    return [];
  }

  const attestations = await Promise.all(
    externalCredentialChains.map((chainId) =>
      getTrackedOnChainCredentials({ chainId, wallets }).catch((err) => {
        log.error(`Error fetching on chain EAS attestations for wallets ${wallets.join(', ')} on chainId ${chainId}`, {
          wallets,
          chainId,
          error: err
        });
        return [] as EASAttestationFromApi[];
      })
    )
  ).then((results) => results.flat());

  return attestations;
}
