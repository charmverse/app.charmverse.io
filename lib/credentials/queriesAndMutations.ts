import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { log } from '@charmverse/core/log';
import type { AttestationType } from '@charmverse/core/prisma-client';
import { Wallet } from 'ethers';

import { credentialsWalletPrivateKey, graphQlServerEndpoint } from 'config/constants';

import type { EasSchemaChain } from './connectors';
import type { EASAttestationFromApi } from './external/getExternalCredentials';
import type { ExternalCredentialChain } from './external/schemas';
import type { ProposalCredential } from './schemas';

const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  uri: graphQlServerEndpoint
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
  mutation CreateCredentials($i: CreateSignedCredentialFourInput!) {
    createSignedCredentialFour(input: $i) {
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
    type: 'internal'
  };
}

export async function publishSignedCredential(input: CredentialToPublish): Promise<EASAttestationFromApi> {
  const record = await apolloClient
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
    .then((doc) => getParsedCredential(doc.data.createSignedCredentialFour.document));
  return record;
}

const GET_CREDENTIALS = gql`
  query GetCredentials($filter: SignedCredentialFourFiltersInput!) {
    signedCredentialFourIndex(filters: $filter, first: 1000) {
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
}): Promise<EASAttestationFromApi[]> {
  const credentialWalletAddress = new Wallet(credentialsWalletPrivateKey as string).address.toLowerCase();
  if (!wallets.length) {
    return [];
  }

  return apolloClient
    .query({
      query: GET_CREDENTIALS,
      variables: {
        filter: {
          where: {
            recipient: { in: wallets.map((w) => w.toLowerCase()) },
            issuer: { equalTo: credentialWalletAddress }
          }
        }
      },
      // For now, let's refetch each time and rely on http endpoint-level caching
      // https://www.apollographql.com/docs/react/data/queries/#supported-fetch-policies
      fetchPolicy: 'no-cache'
    })
    .then(({ data }) => data.signedCredentialFourIndex.edges.map((e: any) => getParsedCredential(e.node)));
}
