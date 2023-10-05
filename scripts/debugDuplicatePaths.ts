import { testUtilsPages, testUtilsUser } from "@charmverse/core/test";
import { prisma } from "@charmverse/core/prisma-client";
import { isTestEnv } from "config/constants";
import { writeToSameFolder } from "lib/utilities/file";

export async function debugDuplicatePaths() {

  if (isTestEnv) {
    const {space, user} = await testUtilsUser.generateUserAndSpace();

    const duplicatePaths = ['path-0001', 'path-0002', 'path-0003']

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
      additionalPaths: []
    })
  }

  const duplicates = await prisma
  .$queryRaw`SELECT unnested, COUNT(*), array_agg(id) AS "pageIds"
  FROM (SELECT unnest("additionalPaths") AS unnested, "id" FROM "Page") AS sub
  GROUP BY unnested
  HAVING COUNT(*) > 1`;
  
  return duplicates;
}


debugDuplicatePaths().then(async data => {
  await writeToSameFolder({data: JSON.stringify(data, null, 2), fileName: 'debug.json'})
})
