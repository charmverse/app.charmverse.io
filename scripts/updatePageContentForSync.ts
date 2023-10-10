import { PageMeta } from '@charmverse/core/pages';
import { pageTree } from '@charmverse/core/pages/utilities';
import { prisma } from '@charmverse/core/prisma-client';
import { applyStepsToNode } from 'lib/prosemirror/applyStepsToNode';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import { PageContent } from 'lib/prosemirror/interfaces';
import { writeToSameFolder } from 'lib/utilities/file';
import type { ProsemirrorJSONStep } from 'lib/websockets/documentEvents/interfaces';
import { Fragment, Slice } from 'prosemirror-model';
import { replaceStep } from 'prosemirror-transform';

export function recurseDocument(content: PageContent, cb: (node: PageContent) => void) {
  function recurse(node: PageContent) {
    cb(node);

    if (node.content) {
      node.content.forEach((childNode) => {
        recurse(childNode);
      });
    }
  }

  recurse(content);
}

const PAGE_SIZE = 100;

export async function updatePageContentForSync() {
  let cursor: string | undefined;
  let completedPages = 0;
  const totalPages = await prisma.page.count({})
  const errors: { pageId: string, error: any }[] = []

  while (true) {
    const pages = await prisma.page.findMany({
      where: {
        id: cursor ? { gt: cursor } : undefined,
        content: {
          not: undefined,
        }
      },
      select: {
        id: true,
        version: true,
        createdBy: true,
        content: true,
      },
      orderBy: {
        id: 'asc',
      },
      take: PAGE_SIZE,
    });
  
    if (pages.length === 0) {
      break;
    }

    for (const page of pages) {
      const {createdBy, id, version} = page;
      try {
        const childPages = await prisma.page.findMany({
          where: {
            parentId: page.id,
          },
          select: {
            id: true,
            index: true,
            createdAt: true,
            path: true,
            type: true,
          }
        });
  
        const childPageIds = pageTree.sortNodes(childPages as PageMeta[]).map((childPage) => childPage.id);
        const pageContent = page.content as PageContent;
        const nestedPageIds: Set<string> = new Set();
        let doc = getNodeFromJson(pageContent);
        const linkedPageConversionSteps: ProsemirrorJSONStep[] = [];
        doc.nodesBetween(0, doc.content.size, (node, pos) => {
          switch (node.type.name) {
            case 'page': {
              const pageId = node.attrs.id;
              if (!pageId) {
                return false;
              }
              if (pageId && !childPageIds.includes(pageId) || nestedPageIds.has(pageId)) {
                const jsonNode = node.toJSON()
                jsonNode.type = "page-link";
                const newNode = getNodeFromJson(jsonNode);
                const linkedPageConversionStep = replaceStep(doc, pos, pos + node.nodeSize, new Slice(Fragment.from(newNode), 0, 0));
                if (linkedPageConversionStep) {
                  linkedPageConversionSteps.push(linkedPageConversionStep.toJSON());
                }
              } else if (pageId) {
                nestedPageIds.add(pageId);
              }

              return false;
            }
            default:
              return true;
          }
        });

        doc = applyStepsToNode(linkedPageConversionSteps, doc);
        const nestedPageAppendSteps: ProsemirrorJSONStep[] = [];
        const childPagesNotInDocument = childPages.filter((childPage) => !nestedPageIds.has(childPage.id));
        childPagesNotInDocument.forEach(childPage => {
          const nestedPageAppendStep: ProsemirrorJSONStep = {
            from: doc.content.size,
            stepType: "replace",
            slice: {
              content: [
                {
                  type: "page-link",
                  attrs: {
                    id: childPage.id,
                    path: childPage.path,
                    type: childPage.type,
                    track: []
                  }
                }
              ],
            },
            to: doc.content.size,
          }
          doc = applyStepsToNode([nestedPageAppendStep], doc);
          nestedPageAppendSteps.push(nestedPageAppendStep);
        })

        const newContent = doc.toJSON();

        const pageDiffs = [
          {
            createdBy,
            data: {
              rid: 0,
              type: 'diff',
              v: version,
              cid: 0,
              ds: linkedPageConversionSteps
            },
            pageId: id,
            version
          },
          ...nestedPageAppendSteps.map((nestedPageAppendStep, index) => ({
            createdBy,
            data: {
              rid: 0,
              type: 'diff',
              v: version + index + 1,
              cid: 0,
              ds: [nestedPageAppendStep]
            },
            pageId: id,
            version: version + index + 1
          }))
        ]

        const finalVersion = version + pageDiffs.length

        await prisma.$transaction([
          prisma.pageDiff.createMany({
            data: pageDiffs
          }),
          prisma.page.update({
            where: {
              id
            },
            data: {
              content: newContent,
              version: finalVersion
            }
          })
        ]);
        console.log(`Complete updating page [${++completedPages}/${totalPages}]: ${page.id}`)
      } catch (error) {
        errors.push({ pageId: page.id, error });
      }
    }
  }

  if (errors.length > 0) {
    await writeToSameFolder({
      fileName: 'updatePageContentForSyncErrors.json',
      data: JSON.stringify(errors, null, 2)
    })
  }
}

updatePageContentForSync();