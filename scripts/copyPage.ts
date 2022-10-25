import { getPage, PageNotFoundError } from "lib/pages/server";
import {prisma} from 'db'
import { MissingDataError } from "lib/utilities/errors";
import { PrintSharp } from "@mui/icons-material";


async function copyPage({pagePath, spaceDomain, targetDomains}: {pagePath: string, spaceDomain: string, targetDomains: string[]}): Promise<void> {
  if (targetDomains.length === 0) {
    throw new MissingDataError("No target domains provided");
  }
  
  const page = await prisma.page.findFirst({
    where: {
      path: pagePath,
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

    }
  });

  if (!page) {
    throw new PageNotFoundError(`${spaceDomain}/${pagePath}`);
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

 
  // await prisma.$transaction(spaces.map(space => {
  //   return prisma.page.create({
  //     ...page,
  //     spaceId: space.id
  //   })
  // }))
  

  // const targetPage = await createPage(page, targetDomains);
  // await createPageContent(pageContent, targetPage, targetDomains);
  // await createPageAttachments(pageAttachments, targetPage, targetDomains);
}