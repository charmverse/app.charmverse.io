import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';

async function query() {
  const result = await prisma.scout.findMany();
  console.log(result);
}

query();
