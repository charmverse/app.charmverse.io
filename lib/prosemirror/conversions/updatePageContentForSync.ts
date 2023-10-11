import { log } from '@charmverse/core/log';
import type { PageMeta } from '@charmverse/core/pages';
import { pageTree } from '@charmverse/core/pages/utilities';
import { prisma } from '@charmverse/core/prisma-client';
import { Fragment, Slice } from 'prosemirror-model';
import { replaceStep } from 'prosemirror-transform';

import { applyStepsToNode } from 'lib/prosemirror/applyStepsToNode';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { isTruthy } from 'lib/utilities/types';
import type { ProsemirrorJSONStep } from 'lib/websockets/documentEvents/interfaces';

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

export async function updatePageContentForSync(
  config: { PAGE_SIZE: number } = {
    PAGE_SIZE: 100
  }
) {
  const { PAGE_SIZE } = config;
  let completedPages = 0;
  const totalPages = await prisma.page.count({});
  let skip = 0;

  while (skip < totalPages) {
    const pages = await prisma.page.findMany({
      where: {
        content: {
          not: undefined
        }
      },
      select: {
        id: true,
        version: true,
        createdBy: true,
        content: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      skip,
      take: PAGE_SIZE
    });

    for (const page of pages) {
      const { createdBy, id, version } = page;
      try {
        const childPages = await prisma.page.findMany({
          where: {
            parentId: page.id
          },
          select: {
            id: true,
            index: true,
            createdAt: true,
            path: true,
            type: true
          },
          orderBy: {
            createdAt: 'asc'
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
              if ((pageId && !childPageIds.includes(pageId)) || nestedPageIds.has(pageId)) {
                const jsonNode = node.toJSON();
                jsonNode.type = 'linkedPage';
                const newNode = getNodeFromJson(jsonNode);
                const linkedPageConversionStep = replaceStep(
                  doc,
                  pos,
                  pos + node.nodeSize,
                  new Slice(Fragment.from(newNode), 0, 0)
                );
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

        const childPagesNotInDocument = childPages.filter((childPage) => !nestedPageIds.has(childPage.id));
        const nestedPageAppendStep: ProsemirrorJSONStep | null =
          childPagesNotInDocument.length === 0
            ? null
            : {
                from: doc.content.size,
                stepType: 'replace',
                slice: {
                  content: childPagesNotInDocument.map((childPage) => ({
                    type: 'page',
                    attrs: {
                      id: childPage.id,
                      path: childPage.path,
                      type: childPage.type,
                      track: []
                    }
                  }))
                },
                to: doc.content.size
              };

        if (nestedPageAppendStep) {
          doc = applyStepsToNode([nestedPageAppendStep], doc);
        }

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
          nestedPageAppendStep
            ? {
                createdBy,
                data: {
                  rid: 0,
                  type: 'diff',
                  v: version + 1,
                  cid: 0,
                  ds: [nestedPageAppendStep]
                },
                pageId: id,
                version: version + 1
              }
            : null
        ].filter(isTruthy);

        const finalVersion = version + pageDiffs.length;

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
        completedPages += 1;
        log.info(`Complete updating page [${completedPages}/${totalPages}]: ${page.id}`);
      } catch (error) {
        log.error(`Failed to update page ${page.id}`, { error });
      }
    }

    skip += PAGE_SIZE;
  }
}
