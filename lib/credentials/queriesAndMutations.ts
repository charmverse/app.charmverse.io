import { gql } from '@apollo/client';
import { log } from '@charmverse/core/log';
import { prisma, type AttestationType } from '@charmverse/core/prisma-client';
import { Wallet } from 'ethers';

import { credentialsWalletPrivateKey, graphQlServerEndpoint, isStagingEnv } from 'config/constants';

import { ApolloClientWithRedisCache } from './apolloClientWithRedisCache';
import type { EasSchemaChain } from './connectors';
import type { EASAttestationFromApi, EASAttestationWithFavorite } from './external/getOnchainCredentials';
import type { ExternalCredentialChain } from './external/schemas';
import type { CredentialData } from './schemas';
import { proposalCredentialSchemaId } from './schemas/proposal';
import { rewardCredentialSchemaId } from './schemas/reward';

const ceramicGraphQlClient = new ApolloClientWithRedisCache({
  uri: graphQlServerEndpoint,
  // Allows us to bypass native
  persistForSeconds: isStagingEnv ? 5 : 300,
  skipRedisCache: true,
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
        sig
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

function getParsedCredential(credential: CredentialFromCeramic): EASAttestationFromApi {
  let parsed = {} as any;

  try {
    const parsedData = JSON.parse(credential.content);
    parsed = parsedData;
  } catch (err) {
    log.error(`Failed to parse content from ceramic record ${credential.id}`);
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
          sig
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

export async function getCharmverseCredentialsByWallets({
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

  const charmverseCredentials: EASAttestationFromApi[] = await ceramicGraphQlClient
    .query({
      query: GET_CREDENTIALS,
      variables: {
        filter: {
          where: {
            schemaId: { in: [proposalCredentialSchemaId, rewardCredentialSchemaId] },
            recipient: { in: wallets.map((w) => w.toLowerCase()) },
            issuer: { equalTo: credentialWalletAddress }
          }
        }
      }
      // For now, let's refetch each time and rely on http endpoint-level caching
      // https://www.apollographql.com/docs/react/data/queries/#supported-fetch-policies
    })
    .then(({ data }) => data.charmverseCredentialIndex.edges.map((e: any) => getParsedCredential(e.node)));

  const credentialIds = charmverseCredentials.map((c) => c.id);

  const issuedCredentials = await prisma.issuedCredential.findMany({
    where: {
      ceramicId: {
        in: credentialIds
      }
    },
    select: {
      id: true,
      ceramicId: true,
      onChainAttestationId: true,
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

  const issuedCredsMap = issuedCredentials.reduce((acc, val) => {
    acc[val.ceramicId as string] = val;
    return acc;
  }, {} as Record<string, (typeof issuedCredentials)[number]>);

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

  return (
    charmverseCredentials
      // Only display IPFS credentials for which we have a reference in our database, and which have not been attested on-chain
      .filter(
        (credentialFromCeramic) =>
          !!issuedCredsMap[credentialFromCeramic.id] && !issuedCredsMap[credentialFromCeramic.id].onChainAttestationId
      )
      .map((credential) => {
        const issuedCredential = issuedCredentials.find((ic) => ic.ceramicId === credential.id);
        const favoriteCredential = favoriteCredentials.find((fc) => fc.issuedCredentialId === issuedCredential?.id);
        const iconUrl =
          (issuedCredential?.proposal ?? issuedCredential?.rewardApplication?.bounty)?.space.credentialLogo ??
          (issuedCredential?.proposal ?? issuedCredential?.rewardApplication?.bounty)?.space.spaceArtwork;

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
      })
  );
}
