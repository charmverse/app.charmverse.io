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

<<<<<<< Updated upstream
async function query() {
  const result = await prisma.user.findFirst({
    where: {
      username: 'example'
    }
  });

  console.log(result);
=======
// {
//   id: 'dd047716-9512-447a-b9fd-79bfe8ccb280',
//   name: 'Greenpill Network'
// }

async function search() {
  const result = await prisma.space.findUnique({
    where: {
      domain: 'playgotchi'
    },
    include: {
      spaceRoles: {
        include: {
          user: true
        }
      }
    }
  });
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: result.spaceRoles.map((role) => role.userId)
      }
    },
    include: {
      wallets: true,
      verifiedEmails: true,
      GoogleCredential: true
    }
  });
  console.log(users);
>>>>>>> Stashed changes
}

query();
