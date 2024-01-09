import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

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
  id: string;
  issuer: string;
  recipient: string;
  content: string;
  sig: string;
  type: CredentialType;
  verificationUrl: string;
  chainId: number;
  schemaId: string;
  timestamp: Date;
};

const CREATE_SIGNED_CREDENTIAL_MUTATION = gql`
  mutation CreateCredentials($i: CreateSignedCredentialThreeInput!) {
    createSignedCredentialThree(input: $i) {
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

export async function publishSignedCredential(input: CredentialToPublish) {
  const response = await apolloClient.mutate({
    mutation: CREATE_SIGNED_CREDENTIAL_MUTATION,
    variables: {
      i: {
        content: {
          ...input,
          issuer: input.issuer.toLowerCase(),
          recipient: input.recipient.toLowerCase(),
          timestamp: new Date(input.timestamp).toISOString()
        }
      }
    }
  });
  return response.data.createSignedCredentialThree.document;
}

const GET_CREDENTIALS = gql`
  query GetCredentials($filter: SignedCredentialThreeFiltersInput!) {
    signedCredentialThreeIndex(filters: $filter, first: 1000) {
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
      variables: { filter: { where: { recipient: { equalTo: recipient.toLowerCase() } } } }
    })
    .then(({ data }) => data.signedCredentialThreeIndex.edges.map((e: any) => e.node));
}
