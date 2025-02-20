import { gql } from '@apollo/client';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { SchemaDecodedItem } from '@ethereum-attestation-service/eas-sdk';
import { getAddress } from 'viem';

import { easSchemaChains, easSchemaMainnetChains, getOnChainAttestationUrl } from '../connectors';
import type { EasSchemaChain } from '../connectors';
import type { ProposalCredential } from '../schemas/proposal';
import { proposalCredentialSchemaId } from '../schemas/proposal';
import type { RewardCredential } from '../schemas/reward';
import { rewardCredentialSchemaId } from '../schemas/reward';

import { easGraphQlClients } from './easGraphQlClients';
import type { ExternalCredentialChain } from './schemas';
import { externalCredentialChains, trackedCharmverseSchemas, trackedSchemas } from './schemas';

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
      timeCreated
    }
  }
`;

export function getTrackedOnChainCredentials<Chain extends ExternalCredentialChain | EasSchemaChain, Data = any>({
  chainId,
  wallets,
  schemas,
  type = 'onchain'
}: {
  schemas: Record<Chain, { schemaId: string; issuers?: string[] }[]>;
  chainId: Chain;
  wallets?: string[];
  type?: 'onchain' | 'charmverse';
}): Promise<EASAttestationFromApi<Data>[]> {
  const recipient = wallets?.map((w) => getAddress(w));

  const query = {
    OR: schemas[chainId].map((_schema) => ({
      schemaId: {
        equals: _schema.schemaId
      },
      attester: _schema.issuers ? { in: _schema.issuers } : undefined,
      recipient: recipient ? { in: recipient } : undefined
    }))
  };

  return easGraphQlClients[chainId]
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
          chainId,
          type,
          content: JSON.parse(attestation.decodedDataJson).reduce((acc: any, val: SchemaDecodedItem) => {
            acc[val.name] = val.value.value;
            return acc;
          }, {} as any),
          timeCreated: attestation.timeCreated * 1000,
          verificationUrl: getOnChainAttestationUrl({ chainId, attestationId: attestation.id })
        };
      });
    });
}

export async function getCharmverseOnchainCredentials({
  wallets,
  includeTestnets
}: {
  wallets: string[];
  includeTestnets?: boolean;
}) {
  const charmverseAttestations = await Promise.all(
    (includeTestnets ? easSchemaChains : easSchemaMainnetChains.map((c) => c.id)).map((chainId) =>
      getTrackedOnChainCredentials({ chainId, wallets, schemas: trackedCharmverseSchemas, type: 'charmverse' }).catch(
        (err) => {
          log.error(
            `Error fetching on chain EAS attestations for wallets ${wallets.join(', ')} on chainId ${chainId}`,
            {
              wallets,
              chainId,
              error: err
            }
          );
          return [] as EASAttestationFromApi[];
        }
      )
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
  ).reduce(
    (acc, val) => {
      const iconUrl = val.bounty.space.credentialLogo;
      acc[val.id] = iconUrl;
      return acc;
    },
    {} as Record<string, string | null>
  );

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
  ).reduce(
    (acc, val) => {
      const iconUrl = val.space.credentialLogo;
      acc[val.id] = iconUrl;
      return acc;
    },
    {} as Record<string, string | null>
  );

  return {
    rewardCredentials: rewardCredentials.map((attestation) => {
      const iconUrl = (attestation as (typeof rewardCredentials)[number]).submissionId
        ? rewardCredentialIconUrls[(attestation as (typeof rewardCredentials)[number]).submissionId]
        : null;

      attestation.iconUrl = iconUrl;

      return attestation;
    }),
    proposalCredentials: proposalCredentials.map((attestation) => {
      const iconUrl = (attestation as (typeof proposalCredentials)[number]).proposalPageId
        ? proposalCredentialIconUrls[(attestation as (typeof proposalCredentials)[number]).proposalPageId]
        : null;

      attestation.iconUrl = iconUrl;
      return attestation;
    })
  };
}

export async function getOnchainCredentialsById({
  attestations
}: {
  attestations: { id: string; chainId: EasSchemaChain }[];
}): Promise<EASAttestationFromApi[]> {
  const groupedByChain = attestations.reduce(
    (acc, val) => {
      if (!acc[val.chainId]) {
        acc[val.chainId] = [];
      }

      acc[val.chainId].push(val.id);

      return acc;
    },
    {} as Record<EasSchemaChain, string[]>
  );

  const foundAttestations = await Promise.all(
    Object.entries(groupedByChain).map(([chainId, attestationIds]) => {
      const query = {
        id: {
          in: attestationIds
        }
      };

      const numericalChainId = parseInt(chainId) as EasSchemaChain;

      return easGraphQlClients[numericalChainId]
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
              chainId,
              type: 'onchain',
              content: JSON.parse(attestation.decodedDataJson).reduce((acc: any, val: SchemaDecodedItem) => {
                acc[val.name] = val.value.value;
                return acc;
              }, {} as any),
              timeCreated: attestation.timeCreated * 1000,
              verificationUrl: getOnChainAttestationUrl({ chainId: numericalChainId, attestationId: attestation.id })
            } as EASAttestationFromApi;
          });
        });
    })
  ).then((data) => data.flat());

  return foundAttestations;
}

export async function getAllOnChainAttestations({
  wallets,
  includeTestnets
}: {
  wallets: string[];
  includeTestnets?: boolean;
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

  const { proposalCredentials, rewardCredentials } = await getCharmverseOnchainCredentials({
    wallets,
    includeTestnets
  });

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

  return [...proposalCredentials, ...rewardCredentials, ...otherCredentials].map((attestation) => {
    const favoriteCredential = favoriteCredentials.find((f) => f.attestationId === attestation.id);

    if (favoriteCredential) {
      return {
        ...attestation,
        index: favoriteCredential.index,
        favoriteCredentialId: favoriteCredential.id,
        iconUrl: null
      };
    }

    return {
      ...attestation,
      index: -1,
      favoriteCredentialId: null,
      iconUrl: null
    };
  });
}
