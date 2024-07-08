import { gql } from '@apollo/client';
import { ApolloClientWithRedisCache } from 'lib/credentials/apolloClientWithRedisCache';
import {  decodeOptimismProjectSnapshotAttestation, optimismProjectSnapshotAttestationSchemaId } from 'lib/credentials/schemas/optimismProjectSchemas';
import { prettyPrint } from 'lib/utils/strings';

import {RateLimit} from 'async-sema';
import { GET } from 'adapters/http';
import { writeToSameFolder } from 'lib/utils/file';
import { prisma } from '@charmverse/core/dist/cjs/prisma-client';

const rateLimiter = RateLimit(10);

/**
 * Use this script to perform database searches.
 */

async function query() {
  const result = await prisma.user.findFirst({
    where: {
      username: 'example'
    }
  });

  console.log(result);
}

query();
