import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';
import fs from 'node:fs/promises';
import path from 'node:path';

async function exportDocumentPage({ domain, pagePath }: { domain: string; pagePath: string }) {
  if (!domain || !pagePath) {
    throw new InvalidInputError('Missing domain or path');
  }

  const page = await prisma.page.findFirst({
    where: {
      space: {
        domain
      },
      path: pagePath
    },
    select: {
      title: true,
      icon: true,
      path: true,
      headerImage: true,
      hasContent: true,
      content: true,
      contentText: true,
      type: true,
      index: true,
      version: true
    }
  });

  if (!page) {
    console.log(`${domain}/${pagePath} not found`);
    return;
  }

  const pageName = `${page.path}-${Date.now()}.json`;

  const pathName = path.join(__dirname, 'pageExports', pageName);

  await fs.writeFile(pathName, JSON.stringify(page, null, 2));

  console.log('Page exported to:', pathName);
}

exportDocumentPage({
  domain: 'cvt-nft-community-template',
  pagePath: 'page-8618552463778046'
});
