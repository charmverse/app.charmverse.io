import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';

/**
 * Use this script to perform database searches.
 */

async function query() {
  const result = await prisma.scout.deleteMany();
  console.log(result);
}

query();
