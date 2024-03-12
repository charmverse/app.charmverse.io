import { restoreDocument } from 'lib/pages/restoreDocument';
import { prisma } from '@charmverse/core/prisma-client';

const pagePath = 'phi-wallet-ripple-internal-5513363048264384';
const version = 504;

async function restore() {
  const page = await prisma.page.findFirstOrThrow({
    where: {
      path: pagePath
    },
    include: {
      diffs: true
    }
  });

  const pageId = page.id;

  await restoreDocument({
    pageId,
    version
  });

  console.log('Restored to version: ', version);
}

restore().catch((e) => console.error(e));
