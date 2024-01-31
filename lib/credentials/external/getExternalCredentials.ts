import type { ApolloClient } from '@apollo/client';
import { gql } from '@apollo/client';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { SchemaDecodedItem } from '@ethereum-attestation-service/eas-sdk';
import { getAddress } from 'viem';
import { arbitrum, base, optimism } from 'viem/chains';

import { ApolloClientWithRedisCache } from '../apolloClientWithRedisCache';
import type { EasSchemaChain } from '../connectors';
import { getOnChainAttestationUrl } from '../connectors';

import type { ExternalCredentialChain } from './schemas';
import { externalCredentialChains, trackedSchemas } from './schemas';

// For a specific profile, only refresh attestations every half hour
const defaultEASCacheDuration = 1800;

const graphQlClients: Record<ExternalCredentialChain, ApolloClient<any>> = {
  [optimism.id]: new ApolloClientWithRedisCache({
    cacheKeyPrefix: 'optimism-easscan',
    uri: 'https://optimism.easscan.org/graphql',
    persistForSeconds: defaultEASCacheDuration
  }),
  [base.id]: new ApolloClientWithRedisCache({
    cacheKeyPrefix: 'base-easscan',
    uri: 'https://base.easscan.org/graphql',
    persistForSeconds: defaultEASCacheDuration
  }),
  [arbitrum.id]: new ApolloClientWithRedisCache({
    uri: 'https://arbitrum.easscan.org/graphql',
    cacheKeyPrefix: 'arbitrum-easscan',
    persistForSeconds: defaultEASCacheDuration
  })
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
  iconUrl?: string | null;
  issuedCredentialId?: string;
};

export type EASAttestationWithFavorite<T = any> = EASAttestationFromApi<T> & {
  index: number;
  // If its favorite then the value is non null
  favoriteCredentialId: string | null;
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
      }
    })
    .then(({ data }) => {
      return data.attestations.map(
        (attestation: any) =>
          ({
            ...attestation,
            type: 'external',
            chainId,
            content: JSON.parse(attestation.decodedDataJson).reduce((acc: any, val: SchemaDecodedItem) => {
              acc[val.name] = val.value.value;
              return acc;
            }, {} as any),
            timeCreated: attestation.timeCreated * 1000,
            verificationUrl: getOnChainAttestationUrl({ chainId, attestationId: attestation.id })
          } as EASAttestationFromApi)
      );
    });
}

export async function getAllOnChainAttestations({
  wallets
}: {
  wallets: string[];
}): Promise<EASAttestationWithFavorite[]> {
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

  const favoriteCredentials = await prisma.favoriteCredential.findMany({
    where: {
      attestationId: {
        in: attestations.map((a) => a.id)
      }
    },
    select: {
      index: true,
      attestationId: true,
      id: true
    }
  });

  return attestations.map((attestation) => {
    const favoriteCredential = favoriteCredentials.find((f) => f.attestationId === attestation.id);
    if (favoriteCredential) {
      return {
        ...attestation,
        favorite: true,
        index: favoriteCredential.index,
        favoriteCredentialId: favoriteCredential.id
      };
    }

    return {
      ...attestation,
      favorite: false,
      index: -1,
      favoriteCredentialId: null
    };
  });
}
