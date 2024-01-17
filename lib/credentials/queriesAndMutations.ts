import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

import { graphQlServerEndpoint } from 'config/constants';

// Assuming DID and AttestationType are defined elsewhere in your TypeScript code.
type DID = string; // or whatever the actual type is
type AttestationType = 'proposal'; // Extend this based on actual enum values

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
  type: AttestationType;
  verificationUrl: string;
  chainId: number;
  schemaId: string;
  timestamp: Date;
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

export async function publishSignedCredential(input: CredentialToPublish): Promise<PublishedSignedCredential> {
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
  return response.data.createSignedCredentialFour.document;
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
      variables: { filter: { where: { recipient: { equalTo: recipient.toLowerCase() } } } }
    })
    .then(({ data }) => data.signedCredentialFourIndex.edges.map((e: any) => e.node));
}
