import {prisma} from 'db'
import { MissingDataError } from "lib/utilities/errors";
import { Prisma } from "@prisma/client";


async function copyPage({pagePath, spaceDomain, targetDomains}: {pagePath: string, spaceDomain: string, targetDomains: string[]}): Promise<void> {
  if (targetDomains.length === 0) {
    throw new MissingDataError("No target domains provided");
  }
  
  const page = await prisma.page.findFirst({
    where: {
      path: pagePath,
      type: 'page',
      space: {
        domain: spaceDomain
      },
    },
    select: {
      isTemplate: true,
      path: true,
      content: true,
      contentText: true,
      type: true,
      title: true,
      headerImage: true,
      icon: true,

    }
  });

  if (!page) {
    throw new MissingDataError(`${spaceDomain}/${pagePath}`);
  }

  const spaces = await prisma.space.findMany({
    where: {
      domain: {
        in: targetDomains
      }
    }
  });

  if (spaces.length !== targetDomains.length) {

    const missingSpaces = [];

    for (const spaceDomain of targetDomains) {
      if (!spaces.some(s => s.domain === spaceDomain)) {
        missingSpaces.push(spaceDomain);
      }
    }

    throw new MissingDataError("One or more target spaces not found");
  }

 
  await prisma.$transaction(spaces.map(space => {
    return prisma.page.create({
      data: {
        ...page,
        content: page.content as Prisma.InputJsonValue,
        author: {
          connect: {
            id: space.createdBy
          }
        },
        updatedBy: space.createdBy,
        space: {
          connect: {
            id: space.id
          }
        },
        permissions: {
          createMany: {
            data: [{
              spaceId: space.id,
              permissionLevel: 'full_access'
            }]
          }
        }
      }
    })
  }))
  
}

// copyPage({
//   spaceDomain: 'cvt-andy-land',
//   pagePath: 'page-9682955150602588',
//   targetDomains: ['gerals-station', 'charmverse-demo']
// }).then(() => {
//   console.log('Done')
// })
// .catch(e => {
//   console.warn(e)
// })