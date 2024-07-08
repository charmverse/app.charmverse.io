import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function query() {
  const result = await prisma.page.update({
    where: {
      id: '09ad994d-dc30-470f-8067-452a33b796f5'
    },
    data: {
      convertedProposalId: null
    }
  });

  console.log(result);
}

query();
