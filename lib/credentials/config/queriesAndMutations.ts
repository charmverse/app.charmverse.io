import type { ApolloQueryResult } from '@apollo/client';
import { gql, ApolloClient, InMemoryCache } from '@apollo/client';

import { graphQlServerEndpoint } from 'config/constants';

// Assuming DID and CredentialType are defined elsewhere in your TypeScript code.
type DID = string; // or whatever the actual type is
type CredentialType = 'proposal'; // Extend this based on actual enum values

const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  uri: graphQlServerEndpoint
});

/**
 * @content - The actual keymap values of the credential created using EAS
 */
export type PublishedSignedCredential = {
  author: DID;
  issuer: string;
  recipient: string;
  content: string;
  sig: string;
  type: CredentialType;
  verificationUrl: string;
  chainId: number;
  schemaId: string;
  timestamp: number;
};

const CREATE_SIGNED_CREDENTIAL_MUTATION = gql`
  mutation CreateCredentials($i: CreateSignedCredentialTwoInput!) {
    createSignedCredentialTwo(input: $i) {
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

export async function publishSignedCredential(input: Omit<PublishedSignedCredential, 'author'>) {
  try {
    const response = await apolloClient.mutate({
      mutation: CREATE_SIGNED_CREDENTIAL_MUTATION,
      variables: { i: input }
    });
    return response.data.createSignedCredentialTwo.document;
  } catch (error) {
    // Handle or throw the error based on your application's error handling logic
    console.error('Error creating SignedCredentialTwo:', error);
    throw error;
  }
}

const GET_CREDENTIALS_BY_RECIPIENT = gql`
  query GetCredentialsByRecipient($recipient: String!) {
    signedCredentialTwoIndex(recipient: $recipient, first: 2) {
      edges {
        node {
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

export async function getCredentialsByRecipient(recipient: string): Promise<PublishedSignedCredential> {
  return apolloClient
    .query({
      query: GET_CREDENTIALS_BY_RECIPIENT,
      variables: { recipient }
    })
    .then(({ data }) => data.signedCredentialTwoIndex.edges[0].node);
}
