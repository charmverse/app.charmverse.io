import { gql } from '@apollo/client';
import { log } from '@charmverse/core/log';
import { prisma, type AttestationType } from '@charmverse/core/prisma-client';
import { Wallet } from 'ethers';
import { optimism } from 'viem/chains';

import { credentialsWalletPrivateKey, graphQlServerEndpoint, isStagingEnv } from 'config/constants';

import { ApolloClientWithRedisCache } from './apolloClientWithRedisCache';
import type { EasSchemaChain } from './connectors';
import type { EASAttestationFromApi, EASAttestationWithFavorite } from './external/getOnchainCredentials';
import type { ExternalCredentialChain } from './external/schemas';
import { attestationSchemaIds } from './schemas';
import type { ProposalCredential } from './schemas';

const ceramicGraphQlClient = new ApolloClientWithRedisCache({
  uri: graphQlServerEndpoint,
  // Allows us to bypass native
  persistForSeconds: isStagingEnv ? 5 : 300,
  skipRedisCache: isStagingEnv,
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
  timestamp: Date;
};

/**
 * @content - The actual keymap values of the credential created using EAS
 */
export type PublishedSignedCredential = Omit<CredentialFromCeramic, 'content'> & {
  content: ProposalCredential;
};

const CREATE_SIGNED_CREDENTIAL_MUTATION = gql`
  mutation CreateCredentials($i: CreateCharmVerseCredentialInput!) {
    createCharmVerseCredential(input: $i) {
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
    .then((doc) => getParsedCredential(doc.data.createCharmVerseCredential.document));
  return record;
}

const GET_CREDENTIALS = gql`
  query GetCredentials($filter: CharmVerseCredentialFiltersInput!) {
    charmVerseCredentialIndex(filters: $filter, first: 1000) {
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
            schemaId: { equalTo: attestationSchemaIds.proposal[optimism.id] },
            recipient: { in: wallets.map((w) => w.toLowerCase()) },
            issuer: { equalTo: credentialWalletAddress }
          }
        }
      }
      // For now, let's refetch each time and rely on http endpoint-level caching
      // https://www.apollographql.com/docs/react/data/queries/#supported-fetch-policies
    })
    .then(({ data }) => data.charmVerseCredentialIndex.edges.map((e: any) => getParsedCredential(e.node)));

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

  return charmverseCredentials.map((credential) => {
    const issuedCredential = issuedCredentials.find((ic) => ic.ceramicId === credential.id);
    const favoriteCredential = favoriteCredentials.find((fc) => fc.issuedCredentialId === issuedCredential?.id);
    const iconUrl = issuedCredential?.proposal.space.credentialLogo ?? issuedCredential?.proposal.space.spaceArtwork;

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
