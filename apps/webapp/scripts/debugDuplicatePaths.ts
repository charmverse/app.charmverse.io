import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { Page, Space, prisma } from '@charmverse/core/prisma-client';
import { isTestEnv } from '@packages/config/constants';
import { writeToSameFolder } from 'lib/utils/file';

async function seedDuplicatePages(): Promise<Space> {
  if (!isTestEnv) {
    throw new Error(`Not test env`);
  }
  const { space, user } = await testUtilsUser.generateUserAndSpace();

  const duplicatePaths = ['path-0001', 'path-0002', 'path-0003'];

  const pageWithDuplicate1 = await testUtilsPages.generatePage({
    createdBy: user.id,
    spaceId: space.id,
    path: 'path-0001',
    additionalPaths: [...duplicatePaths, ...duplicatePaths]
  });

  const pageWithDuplicate2 = await testUtilsPages.generatePage({
    createdBy: user.id,
    spaceId: space.id,
    path: 'path-0002',
    additionalPaths: [...duplicatePaths, ...duplicatePaths]
  });

  const pageWithoutDuplicate = await testUtilsPages.generatePage({
    createdBy: user.id,
    spaceId: space.id,
    additionalPaths: [`random-${Math.random()}`]
  });

  return space;
}

type DebugRecord = {
  unnested: string;
  count: string;
  pageIds: Pick<Page, 'id' | 'path'>[];
};

export async function debugDuplicatePaths(spaceDomain?: string): Promise<DebugRecord[]> {
  let querySpaceId = spaceDomain
    ? (await prisma.space.findUniqueOrThrow({ where: { domain: spaceDomain } }))?.id
    : undefined;

  if (!isTestEnv && !spaceDomain) {
    throw new Error('Space ID required in non-test env');
  }

  /**
   if (!spaceDomain) {
     await seedDuplicatePages.then(space => querySpaceId = space.id)
   }
   */

  // const duplicates = await prisma
  // .$queryRaw`SELECT unnested, COUNT(*), array_agg(json_build_object('id', id, 'path', path)) AS "pageIds"
  // FROM (SELECT unnest("additionalPaths") AS unnested, "id", "path" FROM "Page") AS sub
  // GROUP BY unnested
  // HAVING COUNT(*) > 1`;

  const duplicates =
    await prisma.$queryRaw`SELECT unnested, COUNT(*), array_agg(json_build_object('id', id, 'path', path)) AS "pageIds"
  FROM (SELECT unnest("additionalPaths") AS unnested, "id", "path" FROM "Page"  WHERE "spaceId" = UUID(${querySpaceId})) AS sub
  GROUP BY unnested
  HAVING COUNT(*) > 1`;

  await writeToSameFolder({ data: JSON.stringify(duplicates, null, 2), fileName: `duplicates-${Date.now()}.json` });

  return duplicates as DebugRecord[];
}

async function resolveDuplicates(duplicates: DebugRecord[]) {
  for (let i = 0; i < duplicates.length; i++) {
    const dupe = duplicates[i];
    const split = dupe.unnested.split('-');
    const pageNumber = split[split.length - 1];

    const map: Record<string, string> = {};

    for (const pageMeta of dupe.pageIds) {
      // Don't revisit pages
      if (!pageMeta.path.match(pageNumber) && !map[pageMeta.id]) {
        console.log('Fixing', pageMeta.path);
        map[pageMeta.id] = pageMeta.id;

        const existingPage = await prisma.page.findUniqueOrThrow({
          where: {
            id: pageMeta.id
          },
          select: {
            additionalPaths: true
          }
        });

        // Reset the paths to those not matching the unique scheme
        const filteredPaths = existingPage.additionalPaths.filter((path) => !path.match(pageNumber));

        await prisma.page.update({
          where: {
            id: pageMeta.id
          },
          data: {
            additionalPaths: filteredPaths
          }
        });
      }
    }
    console.log('Processed duplicates:', i + 1, '/', duplicates.length);
  }
}

debugDuplicatePaths('spacename').then(resolveDuplicates);
