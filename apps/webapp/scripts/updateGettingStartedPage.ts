import { prisma } from '@charmverse/core/prisma-client';
import { PageNotFoundError } from '@packages/pages/errors';
import { InvalidInputError } from '@packages/utils/errors';
import type { GettingStartedPage } from 'seedData/gettingStartedPage';
import { gettingStartedPage } from 'seedData/gettingStartedPage';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Use this script to update the default Getting Started page for spaces.
 * @docs https://app.charmverse.io/charmverse/page-22634121121754958
 */
async function updateGettingStartedPage({ spaceDomain, pagePath }: { spaceDomain: string; pagePath: string }) {
  if (!spaceDomain || !pagePath) {
    throw new InvalidInputError('You must provide a space domain and page path.');
  }

  const page = await prisma.page.findFirst({
    where: {
      path: pagePath,
      space: {
        domain: spaceDomain
      }
    },
    select: {
      icon: true,
      headerImage: true,
      content: true,
      contentText: true
    }
  });

  if (!page) {
    throw new PageNotFoundError(`${spaceDomain}/${pagePath}`);
  }

  const gettingStartedFile = path.join(path.resolve(), 'seedData', 'gettingStartedPage.ts');

  const fileContent = await fs.readFile(gettingStartedFile, 'utf-8');

  // Get any code and assertions written before the export of the getting started page
  const fileContentPre = fileContent.split('export const')[0].trim();

  const newGettingStartedPage: GettingStartedPage = {
    // Keep the manually assigned fields so we have a single place to set things like page index and version
    ...gettingStartedPage,
    ...page
  };

  const { content, contentText, ...pageWithoutContent } = newGettingStartedPage;
  console.log('pageWithoutContent', pageWithoutContent);

  // Construct the updated code for this page
  const newContent = `${fileContentPre}\r\n\r\nexport const gettingStartedPage: GettingStartedPage = ${JSON.stringify(
    newGettingStartedPage,
    null,
    2
  )};`;

  await fs.writeFile(gettingStartedFile, newContent, 'utf-8');

  console.log('✅ Updated getting started page');

  console.log('Running linter...');
  execSync('npx eslint --fix seedData/gettingStartedPage.ts');

  console.log('🚀 Done! Please commit the changes to the getting started page.');
}

// updateGettingStartedPage({spaceDomain: 'cvt-template-creator', pagePath: 'page-548810048920541'})
