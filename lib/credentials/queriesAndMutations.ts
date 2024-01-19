import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { Wallet } from 'ethers';

import { credentialsWalletPrivateKey, graphQlServerEndpoint } from 'config/constants';

import type { ProposalCredential } from './schemas';

const credentialWalletAddress = new Wallet(credentialsWalletPrivateKey).address.toLowerCase();

// Assuming DID and AttestationType are defined elsewhere in your TypeScript code.
type DID = string; // or whatever the actual type is
type AttestationType = 'proposal'; // Extend this based on actual enum values

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
  chainId: number;
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

function getParsedCredential(credential: CredentialFromCeramic): PublishedSignedCredential {
  let parsed = {} as any;

  try {
    const parsedData = JSON.parse(credential.content);
    parsed = parsedData;
  } catch (err) {
    log.error(`Failed to parse content from ceramic record ${credential.id}`);
  }

  return {
    ...credential,
    content: parsed
  };
}

export async function publishSignedCredential(input: CredentialToPublish): Promise<PublishedSignedCredential> {
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

export async function getCredentialsByRecipient({
  recipient
}: {
  recipient: string;
}): Promise<PublishedSignedCredential> {
  return apolloClient
    .query({
      query: GET_CREDENTIALS,
      variables: {
        filter: {
          where: {
            recipient: { equalTo: recipient.toLowerCase() },
            issuer: { equalTo: credentialWalletAddress }
          }
        }
      }
    })
    .then(({ data }) => data.signedCredentialFourIndex.edges.map((e: any) => getParsedCredential(e.node)));
}
export async function getCredentialsByUserId({ userId }: { userId: string }): Promise<PublishedSignedCredential[]> {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      wallets: true
    }
  });

  const credentials: PublishedSignedCredential[] = await Promise.all(
    user.wallets.map((w) => getCredentialsByRecipient({ recipient: w.address }))
  ).then((data) => data.flat());

  return credentials;
}
