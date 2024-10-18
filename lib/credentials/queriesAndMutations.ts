import { gql } from '@apollo/client';
import { log } from '@charmverse/core/log';
import { prisma, type AttestationType } from '@charmverse/core/prisma-client';
import { credentialsWalletPrivateKey, graphQlServerEndpoint, isDevEnv, isStagingEnv } from '@root/config/constants';
import { Wallet } from 'ethers';

import { ApolloClientWithRedisCache } from './apolloClientWithRedisCache';
import type { EasSchemaChain } from './connectors';
import type { EASAttestationFromApi, EASAttestationWithFavorite } from './external/getOnchainCredentials';
import type { ExternalCredentialChain } from './external/schemas';
import { externalCredentialSchemaId } from './schemas/external';
import type { CredentialData } from './schemas/interfaces';
import { proposalCredentialSchemaId } from './schemas/proposal';
import { rewardCredentialSchemaId } from './schemas/reward';

const ceramicGraphQlClient = new ApolloClientWithRedisCache({
  uri: graphQlServerEndpoint,
  // Allows us to bypass native
  persistForSeconds: 300,
  skipRedisCache: isStagingEnv || isDevEnv,
  cacheKeyPrefix: 'ceramic'
});

type CredentialFromCeramic = {
  id: string;
  issuer: string;
  recipient: string;
  content: string;
  sig: string;
  type: AttestationType;
  verificationUrl: string;
  chainId: ExternalCredentialChain | EasSchemaChain;
  schemaId: string;
  charmverseId?: string;
  timestamp: Date;
};

/**
 * @content - The actual keymap values of the credential created using EAS
 */
export type PublishedSignedCredential<T extends AttestationType = AttestationType> = Omit<
  CredentialFromCeramic,
  'content'
> & {
  content: CredentialData<T>['data'];
};

const CREATE_SIGNED_CREDENTIAL_MUTATION = gql`
  mutation CreateCredentials($i: CreateCharmverseCredentialInput!) {
    createCharmverseCredential(input: $i) {
      document {
        id
        type
        issuer
        chainId
        content
        schemaId
        recipient
        verificationUrl
        timestamp
        charmverseId
      }
    }
  }
`;

export type CredentialToPublish = Omit<PublishedSignedCredential, 'author' | 'id'>;

export function getParsedCredential(credential: CredentialFromCeramic): EASAttestationFromApi {
  let parsed = {} as any;

  if (typeof credential.content === 'object') {
    parsed = credential.content;
  } else {
    try {
      const parsedData = JSON.parse(credential.content);
      parsed = parsedData;
    } catch (err) {
      log.error(`Failed to parse content from ceramic record ${credential.id}`);
    }
  }

  return {
    ...credential,
    content: parsed,
    attester: credential.issuer,
    timeCreated: new Date(credential.timestamp).valueOf(),
    type: 'charmverse'
  };
}

export async function publishSignedCredential(input: CredentialToPublish): Promise<EASAttestationFromApi> {
  const record = await ceramicGraphQlClient
    .mutate({
      mutation: CREATE_SIGNED_CREDENTIAL_MUTATION,
      variables: {
        i: {
          content: {
            ...input,
            content: JSON.stringify(input.content),
            issuer: input.issuer.toLowerCase(),
            recipient: input.recipient.toLowerCase(),
            timestamp: new Date(input.timestamp).toISOString()
          }
        }
      }
    })
    .then((doc) => getParsedCredential(doc.data.createCharmverseCredential.document));

  return record;
}

const GET_CREDENTIALS = gql`
  query GetCredentials($filter: CharmverseCredentialFiltersInput!) {
    charmverseCredentialIndex(filters: $filter, first: 1000) {
      edges {
        node {
          id
          issuer
          recipient
          content
          type
          verificationUrl
          chainId
          schemaId
          timestamp
          charmverseId
        }
      }
    }
  }
`;

const GET_CREDENTIALS_BY_ID = gql`
  query GetCredentialsById($ids: [ID!]!) {
    nodes(ids: $ids) {
      id
      __typename
      ... on CharmverseCredential {
        id
        issuer
        recipient
        content
        type
        verificationUrl
        chainId
        schemaId
        timestamp
        charmverseId
      }
    }
  }
`;

export async function getCharmverseOffchainCredentialsByIds({
  ceramicIds
}: {
  ceramicIds: string[];
}): Promise<EASAttestationFromApi[]> {
  if (!ceramicIds.length) {
    return [];
  }

  const charmverseCredentials: EASAttestationFromApi[] | null = await ceramicGraphQlClient
    .query({
      query: GET_CREDENTIALS_BY_ID,
      variables: {
        ids: ceramicIds
      }
      // For now, let's refetch each time and rely on http endpoint-level caching
      // https://www.apollographql.com/docs/react/data/queries/#supported-fetch-policies
    })
    .then((response) =>
      response
        ? response.data.nodes.map((e: any) => getParsedCredential(e))
        : Promise.reject(new Error('Unknown error'))
    )
    .catch((err) => {
      log.error('Failed to fetch offchain credentials from ceramic', { error: err, ceramicIds });
      return null;
    });

  return charmverseCredentials ?? [];
}

export async function getCharmverseOffchainCredentialsByWallets({
  wallets
}: {
  wallets: string[];
}): Promise<EASAttestationWithFavorite[]> {
  if (typeof credentialsWalletPrivateKey !== 'string') {
    return [];
  }
  const credentialWalletAddress = new Wallet(credentialsWalletPrivateKey).address.toLowerCase();
  if (!wallets.length) {
    return [];
  }

  const lowerCaseWallets = wallets.map((w) => w.toLowerCase());

  const charmverseCredentials: EASAttestationFromApi[] | null = await ceramicGraphQlClient
    .query({
      query: GET_CREDENTIALS,
      variables: {
        filter: {
          where: {
            schemaId: { in: [proposalCredentialSchemaId, rewardCredentialSchemaId] },
            recipient: { in: lowerCaseWallets },
            issuer: { equalTo: credentialWalletAddress }
          }
        }
      }
      // For now, let's refetch each time and rely on http endpoint-level caching
      // https://www.apollographql.com/docs/react/data/queries/#supported-fetch-policies
    })
    .then((response) =>
      response
        ? response.data.charmverseCredentialIndex.edges.map((e: any) => getParsedCredential(e.node))
        : Promise.reject(new Error('Unknown error'))
    )
    .catch((err) => {
      log.error('Failed to fetch offchain credentials from ceramic', { error: err, wallets });
      return null;
    });

  const credentialIds = charmverseCredentials?.map((c) => c.id);

  const issuedCredentials = await prisma.issuedCredential.findMany({
    where: charmverseCredentials
      ? {
          ceramicId: {
            in: credentialIds
          }
        }
      : {
          user: {
            wallets: {
              some: {
                address: {
                  in: wallets
                }
              }
            }
          }
        },
    select: {
      id: true,
      ceramicId: true,
      // Only fetch the saved record if we failed to fetch data from ceramic
      ceramicRecord: !charmverseCredentials,
      onchainAttestationId: true,
      rewardApplication: {
        select: {
          bounty: {
            select: {
              space: {
                select: {
                  spaceArtwork: true,
                  credentialLogo: true
                }
              }
            }
          }
        }
      },
      proposal: {
        select: {
          space: {
            select: {
              spaceArtwork: true,
              credentialLogo: true
            }
          }
        }
      }
    }
  });

  const issuedCredsMap = issuedCredentials.reduce(
    (acc, val) => {
      acc[val.ceramicId as string] = val;
      return acc;
    },
    {} as Record<string, (typeof issuedCredentials)[number]>
  );

  const favoriteCredentials = await prisma.favoriteCredential.findMany({
    where: {
      issuedCredentialId: {
        in: issuedCredentials.map((a) => a.id)
      }
    },
    select: {
      index: true,
      issuedCredentialId: true,
      id: true
    }
  });

  const sourceData = charmverseCredentials
    ? charmverseCredentials
        // Only display IPFS credentials for which we have a reference in our database, and which have not been attested on-chain
        .filter(
          (credentialFromCeramic) =>
            !!issuedCredsMap[credentialFromCeramic.id] && !issuedCredsMap[credentialFromCeramic.id].onchainAttestationId
        )
    : issuedCredentials
        .filter((ic) => !!ic.ceramicRecord)
        .map((cachedCred) => getParsedCredential(cachedCred.ceramicRecord as any as CredentialFromCeramic));

  return sourceData.map((credential) => {
    const issuedCredential = issuedCredentials.find((ic) => ic.ceramicId === credential.id);
    const favoriteCredential = favoriteCredentials.find((fc) => fc.issuedCredentialId === issuedCredential?.id);
    const iconUrl =
      (issuedCredential?.proposal ?? issuedCredential?.rewardApplication?.bounty)?.space.credentialLogo ||
      (issuedCredential?.proposal ?? issuedCredential?.rewardApplication?.bounty)?.space.spaceArtwork ||
      null;

    if (favoriteCredential) {
      return {
        ...credential,
        iconUrl,
        favoriteCredentialId: favoriteCredential.id,
        index: favoriteCredential.index,
        issuedCredentialId: issuedCredential?.id
      };
    }

    return {
      ...credential,
      iconUrl,
      favoriteCredentialId: null,
      index: -1,
      issuedCredentialId: issuedCredential?.id
    };
  });
}

export async function getExternalCredentialsByWallets({
  wallets
}: {
  wallets: string[];
}): Promise<EASAttestationWithFavorite[]> {
  if (typeof credentialsWalletPrivateKey !== 'string') {
    return [];
  }
  const credentialWalletAddress = new Wallet(credentialsWalletPrivateKey).address.toLowerCase();
  if (!wallets.length) {
    return [];
  }

  const externalCredentials: EASAttestationFromApi[] = await ceramicGraphQlClient
    .query({
      query: GET_CREDENTIALS,
      variables: {
        filter: {
          where: {
            schemaId: { in: [externalCredentialSchemaId] },
            recipient: { in: wallets.map((w) => w.toLowerCase()) },
            issuer: { equalTo: credentialWalletAddress }
          }
        }
      }
      // For now, let's refetch each time and rely on http endpoint-level caching
      // https://www.apollographql.com/docs/react/data/queries/#supported-fetch-policies
    })
    .then((response) =>
      response
        ? response.data.charmverseCredentialIndex.edges.map((e: any) => getParsedCredential(e.node))
        : Promise.reject(new Error('Unknown error'))
    );

  const blacklistedNameRegexes = [/test/i, /demo/i];

  return externalCredentials
    .map((credential) => ({
      ...credential,
      iconUrl: null,
      favoriteCredentialId: null,
      index: -1,
      issuedCredentialId: undefined
    }))
    .filter((c) => c?.content.Name && !blacklistedNameRegexes.some((pattern) => pattern.test(c.content.Name)));
}
