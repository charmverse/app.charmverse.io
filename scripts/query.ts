import { gql } from '@apollo/client';
import { ApolloClientWithRedisCache } from 'lib/credentials/apolloClientWithRedisCache';
import { OptimismProjectSnapshotAttestation, decodeOptimismProjectSnapshotAttestation, optimismProjectSnapshotAttestationSchemaId } from 'lib/credentials/schemas/optimismProjectSchemas';
import { prettyPrint } from 'lib/utils/strings';

import {RateLimit} from 'async-sema';
import { GET } from 'adapters/http';
import { writeToSameFolder } from 'lib/utils/file';

const rateLimiter = RateLimit(10);

/**
 * Use this script to perform database searches.
 */

// {
//   id: 'dd047716-9512-447a-b9fd-79bfe8ccb280',
//   name: 'Greenpill Network'
// }

const graphql = new ApolloClientWithRedisCache({
  cacheKeyPrefix: 'optimism-easscan',
  uri: 'https://optimism.easscan.org/graphql',
  persistForSeconds: 60 * 60 * 24
})


const QUERY = gql`
query ($where: AttestationWhereInput) {
  attestations(where: $where, take: 100) {
    data
  }
}
`;

graphql.query({
  query: QUERY,
  variables: {
    where: {
      schemaId: {
        equals: optimismProjectSnapshotAttestationSchemaId
      }
    }
  }

})
// @ts-ignore
.then(({data}) => data.attestations.map((attestation: any) => decodeOptimismProjectSnapshotAttestation(attestation.data)) )
.then(async parsedAttestations => {
  console.log(parsedAttestations.length);
  const metadataJson = await Promise.all(parsedAttestations.map(async (attestation: OptimismProjectSnapshotAttestation) => {
    await rateLimiter();

    const metadata = await GET(attestation.metadataUrl).catch(() => null);

    return metadata;

  }));

  const filtered = metadataJson.filter((metadata: any) => metadata !== null);

  return filtered;
}).then(async(filtered) => {
  await writeToSameFolder({fileName: 'optimism-metadata.json', data: JSON.stringify(filtered, null, 2)});
});