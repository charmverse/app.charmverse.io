import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';

/**
 * Use this script to perform database searches.
 */

async function query() {
  const productUpdatesFrames = await prisma.productUpdatesFarcasterFrame.findMany();

  prettyPrint(productUpdatesFrames);
}

query();
