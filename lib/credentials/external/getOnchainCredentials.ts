import type { ApolloClient } from '@apollo/client';
import { gql } from '@apollo/client';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { SchemaDecodedItem } from '@ethereum-attestation-service/eas-sdk';
import { getAddress } from 'viem';
import { arbitrum, base, optimism, optimismSepolia, sepolia } from 'viem/chains';

import { isProdEnv } from 'config/constants';

import { ApolloClientWithRedisCache } from '../apolloClientWithRedisCache';
import type { EasSchemaChain } from '../connectors';
import { easSchemaChains, getOnChainAttestationUrl } from '../connectors';
import type { ProposalCredential } from '../schemas/proposal';
import { proposalCredentialSchemaId } from '../schemas/proposal';
import type { RewardCredential } from '../schemas/reward';
import { rewardCredentialSchemaId } from '../schemas/reward';

import type { ExternalCredentialChain } from './schemas';
import { externalCredentialChains, trackedCharmverseSchemas, trackedSchemas } from './schemas';

// For a specific profile, only refresh attestations every half hour
const defaultEASCacheDuration = 1800;

const graphQlClients: Record<ExternalCredentialChain | EasSchemaChain, ApolloClient<any>> = {
  [optimism.id]: new ApolloClientWithRedisCache({
    cacheKeyPrefix: 'optimism-easscan',
    uri: 'https://optimism.easscan.org/graphql',
    persistForSeconds: defaultEASCacheDuration,
    skipRedisCache: !isProdEnv
  }),
  [sepolia.id]: new ApolloClientWithRedisCache({
    cacheKeyPrefix: 'optimism-easscan',
    uri: 'https://optimism-sepolia.easscan.org/graphql',
    persistForSeconds: defaultEASCacheDuration,
    skipRedisCache: !isProdEnv
  }),
  [optimismSepolia.id]: new ApolloClientWithRedisCache({
    cacheKeyPrefix: 'optimism-easscan',
    uri: 'https://optimism-sepolia.easscan.org/graphql',
    persistForSeconds: defaultEASCacheDuration,
    skipRedisCache: !isProdEnv
  }),
  [base.id]: new ApolloClientWithRedisCache({
    cacheKeyPrefix: 'base-easscan',
    uri: 'https://base.easscan.org/graphql',
    persistForSeconds: defaultEASCacheDuration,
    skipRedisCache: !isProdEnv
  }),
  [arbitrum.id]: new ApolloClientWithRedisCache({
    uri: 'https://arbitrum.easscan.org/graphql',
    cacheKeyPrefix: 'arbitrum-easscan',
    persistForSeconds: defaultEASCacheDuration,
    skipRedisCache: !isProdEnv
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
  type: 'onchain' | 'charmverse' | 'gitcoin';
  verificationUrl: string | null;
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

function getTrackedOnChainCredentials<Chain extends ExternalCredentialChain | EasSchemaChain>({
  chainId,
  wallets,
  schemas
}: {
  schemas: Record<Chain, { schemaId: string; issuers: string[] }[]>;
  chainId: Chain;
  wallets: string[];
}): Promise<EASAttestationFromApi[]> {
  const recipient = wallets.map((w) => getAddress(w));

  const query = {
    OR: schemas[chainId].map((_schema) => ({
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
      return data.attestations.map((attestation: any) => {
        return {
          ...attestation,
          type: 'onchain',
          content: JSON.parse(attestation.decodedDataJson).reduce((acc: any, val: SchemaDecodedItem) => {
            acc[val.name] = val.value.value;
            return acc;
          }, {} as any),
          timeCreated: attestation.timeCreated * 1000,
          verificationUrl: getOnChainAttestationUrl({ chainId: attestation.chainId, attestationId: attestation.id })
        };
      });
    });
}

export async function getCharmverseCredentials({ wallets }: { wallets: string[] }) {
  const charmverseAttestations = await Promise.all(
    easSchemaChains.map((chainId) =>
      getTrackedOnChainCredentials({ chainId, wallets, schemas: trackedCharmverseSchemas }).catch((err) => {
        log.error(`Error fetching on chain EAS attestations for wallets ${wallets.join(', ')} on chainId ${chainId}`, {
          wallets,
          chainId,
          error: err
        });
        return [] as EASAttestationFromApi[];
      })
    )
  ).then((results) => results.flat());

  const { rewardCredentials, proposalCredentials } = charmverseAttestations.reduce(
    (acc, val) => {
      if (val.schemaId === rewardCredentialSchemaId) {
        const submissionId = (val.content as RewardCredential).rewardURL.split('/').pop()?.trim();
        if (submissionId && stringUtils.isUUID(submissionId)) {
          acc.rewardCredentials.push({ ...val, submissionId });
        }
      } else if (val.schemaId === proposalCredentialSchemaId) {
        const proposalPageId = (val.content as ProposalCredential).URL.split('/').pop()?.trim();
        if (proposalPageId && stringUtils.isUUID(proposalPageId)) {
          acc.proposalCredentials.push({ ...val, proposalPageId });
        }
      }
      return acc;
    },
    { rewardCredentials: [], proposalCredentials: [] } as {
      rewardCredentials: (EASAttestationFromApi & { submissionId: string })[];
      proposalCredentials: (EASAttestationFromApi & { proposalPageId: string })[];
    }
  );

  return {
    rewardCredentials,
    proposalCredentials
  };
}

export async function getAllOnChainAttestations({
  wallets
}: {
  wallets: string[];
}): Promise<EASAttestationWithFavorite[]> {
  if (!wallets.length) {
    return [];
  }

  const otherCredentials = await Promise.all(
    externalCredentialChains.map((chainId) =>
      getTrackedOnChainCredentials({ chainId, wallets, schemas: trackedSchemas }).catch((err) => {
        log.error(`Error fetching on chain EAS attestations for wallets ${wallets.join(', ')} on chainId ${chainId}`, {
          wallets,
          chainId,
          error: err
        });
        return [] as EASAttestationFromApi[];
      })
    )
  ).then((results) => results.flat());

  const { proposalCredentials, rewardCredentials } = await getCharmverseCredentials({ wallets });

  const favoriteCredentials = await prisma.favoriteCredential.findMany({
    where: {
      attestationId: {
        in: [...proposalCredentials, ...rewardCredentials, ...otherCredentials].map((a) => a.id)
      }
    },
    select: {
      index: true,
      attestationId: true,
      id: true
    }
  });

  const rewardCredentialIconUrls = (
    rewardCredentials.length
      ? await prisma.application.findMany({
          where: {
            id: {
              in: rewardCredentials.map((c) => c.submissionId)
            }
          },
          select: {
            id: true,
            bounty: {
              select: {
                space: {
                  select: {
                    credentialLogo: true
                  }
                }
              }
            }
          }
        })
      : []
  ).reduce((acc, val) => {
    const iconUrl = val.bounty.space.credentialLogo;
    acc[val.id] = iconUrl;
    return acc;
  }, {} as Record<string, string | null>);

  const proposalCredentialIconUrls = (
    proposalCredentials.length
      ? await prisma.proposal.findMany({
          where: {
            page: {
              id: {
                in: proposalCredentials.map((c) => c.proposalPageId)
              }
            }
          },
          select: {
            id: true,
            space: {
              select: {
                credentialLogo: true
              }
            }
          }
        })
      : []
  ).reduce((acc, val) => {
    const iconUrl = val.space.credentialLogo;
    acc[val.id] = iconUrl;
    return acc;
  }, {} as Record<string, string | null>);

  return [...proposalCredentials, ...rewardCredentials, ...otherCredentials].map((attestation) => {
    const favoriteCredential = favoriteCredentials.find((f) => f.attestationId === attestation.id);

    const iconUrl = (attestation as (typeof proposalCredentials)[number]).proposalPageId
      ? proposalCredentialIconUrls[(attestation as (typeof proposalCredentials)[number]).proposalPageId]
      : (attestation as (typeof rewardCredentials)[number]).submissionId
      ? rewardCredentialIconUrls[(attestation as (typeof rewardCredentials)[number]).submissionId]
      : null;

    if (favoriteCredential) {
      return {
        ...attestation,
        index: favoriteCredential.index,
        favoriteCredentialId: favoriteCredential.id,
        iconUrl
      };
    }

    return {
      ...attestation,
      index: -1,
      favoriteCredentialId: null,
      iconUrl
    };
  });
}
