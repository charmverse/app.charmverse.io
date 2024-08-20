import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';

/**
 * Use this script to perform database searches.
 */

async function query() {
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
  console.log(result);
}

query();
