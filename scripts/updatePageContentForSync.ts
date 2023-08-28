import { prisma } from '@charmverse/core/prisma-client';
import { emptyDocument } from 'lib/prosemirror/constants';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import { PageContent } from 'lib/prosemirror/interfaces';

export async function updatePageContentForSync() {
  const pages = await prisma.page.findMany({
    select: {
      id: true,
      content: true,
    }
  })

  for (const page of pages) {
    const pageContent = (page.content ?? emptyDocument) as PageContent;
    const nestedPageIds: string[] = [];
    const pageContentNode = getNodeFromJson(pageContent);
    pageContentNode.forEach((node) => {
      if (node.type.name === 'page' && node.attrs) {
        nestedPageIds.push(node.attrs.id);
      }
    });
    const childPages = await prisma.page.findMany({
      where: {
        parentId: page.id,
      },
      select: {
        id: true,
      }
    });
    const childPageIds = childPages.map((childPage) => childPage.id);
    
    // Loop through all child pages and check if they are added to the page content
    childPageIds.forEach(childPageId => {
      if (pageContent.content && !nestedPageIds.includes(childPageId)) {
        pageContent.content.push({
          type: "page",
          attrs: {
            id: childPageId,
          }
        })

        nestedPageIds.push(childPageId);
      }
    })

    await prisma.page.update({
      where: {
        id: page.id,
      },
      data: {
        content: pageContent,
      }
    })

    for (const nestedPageId of nestedPageIds) {
      if (!childPageIds.includes(nestedPageId)) {
        await prisma.page.update({
          where: {
            id: nestedPageId,
          },
          data: {
            parentId: page.id,
          }
        })
      }
    }
  }
}

updatePageContentForSync();
