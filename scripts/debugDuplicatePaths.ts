import { testUtilsPages, testUtilsUser } from "@charmverse/core/test";
import { Page, prisma } from "@charmverse/core/prisma-client";
import { isTestEnv } from "config/constants";
import { writeToSameFolder } from "lib/utilities/file";

type DebugRecord = {
  unnested: string;
  count: string;
  pageIds: Pick<Page, 'id' | 'path'>[] 
}

export async function debugDuplicatePaths(spaceId?: string) {

  let querySpaceId = spaceId;

  if (isTestEnv) {

    const {space, user} = await testUtilsUser.generateUserAndSpace();

    const duplicatePaths = ['path-0001', 'path-0002', 'path-0003'];

    const pageWithDuplicate1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      additionalPaths: duplicatePaths
    })

    const pageWithDuplicate2 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      additionalPaths: duplicatePaths
    })

    const pageWithoutDuplicate = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      additionalPaths: [`random-${Math.random()}`]
    })
  }

  // const duplicates = await prisma
  // .$queryRaw`SELECT unnested, COUNT(*), array_agg(json_build_object('id', id, 'path', path)) AS "pageIds"
  // FROM (SELECT unnest("additionalPaths") AS unnested, "id", "path" FROM "Page") AS sub
  // GROUP BY unnested
  // HAVING COUNT(*) > 1`;

  const duplicates = await prisma
  .$queryRaw`SELECT unnested, COUNT(*), array_agg(json_build_object('id', id, 'path', path)) AS "pageIds"
  FROM (SELECT unnest("additionalPaths") AS unnested, "id", "path" FROM "Page"  WHERE "spaceId" = UUID(${querySpaceId})) AS sub
  GROUP BY unnested
  HAVING COUNT(*) > 1`;

  
  return duplicates;
}


debugDuplicatePaths("spaceid").then(async data => {
  await writeToSameFolder({data: JSON.stringify(data, null, 2), fileName: 'debug-myosin.json'})

  console.log((data as any[]).length, 'duplicate paths found')
})


// prisma.page.updateMany({
//   where: {
//     id: ''
//   },
//   data: {
//     additionalPaths: {

//     }
//   }
// })
// prisma.page.deleteMany({
//   where: {
//     additionalPaths: {
//       hasSome: ['path-0001', 'path-0002', 'path-0003']
//     }
//   }
// }).then(() => console.log('Deleted'))