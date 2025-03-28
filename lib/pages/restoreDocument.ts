import { log } from '@charmverse/core/log';
import type { Page, PageDiff } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';
import { applyStepsToNode } from '@root/lib/prosemirror/applyStepsToNode';
import { emptyDocument } from '@root/lib/prosemirror/constants';
import { getNodeFromJson } from '@root/lib/prosemirror/getNodeFromJson';
import type { PageContent } from '@root/lib/prosemirror/interfaces';
import type { ProsemirrorJSONStep } from '@root/lib/websockets/documentEvents/interfaces';

type RestoreInput = {
  pageId: string;
  version?: number;
};

export function replayDocumentHistory(diffs: PageDiff[]): PageContent {
  const basePageContent: PageContent = { ...emptyDocument };

  const sortedDiffs = diffs
    // Make sure diffs are in correct order
    .sort((a, b) => a.version - b.version)
    // Extract prosemirror change step
    .map((diff) => (diff.data as any).ds as ProsemirrorJSONStep[])
    // Diff ds is stored as an array, unwind this
    .flat()
    // Just in case there are some null diffs
    .filter((diff) => !!diff);

  const pageNode = getNodeFromJson(basePageContent);

  const contentAfterReplay = applyStepsToNode(sortedDiffs, pageNode);

  return contentAfterReplay as any;
}

export async function restoreDocument({ pageId, version }: RestoreInput): Promise<Page> {
  const validVersion = typeof version === 'number' && !Number.isNaN(version);

  const pageWithDiffs = await prisma.page.findFirst({
    where: {
      id: pageId
    },
    select: {
      id: true,
      author: true,
      diffs: {
        orderBy: {
          version: 'asc'
        },
        where: validVersion
          ? {
              version: {
                lte: version
              }
            }
          : undefined
      }
    }
  });

  if (!pageWithDiffs) {
    throw new InvalidInputError(`Page not found`);
  }

  // Return all diffs, or just those corresponding to an earlier range in time

  const contentAfterUpdate = replayDocumentHistory(pageWithDiffs.diffs);

  const pageAfterUpdate: Page = await prisma.$transaction(async (tx) => {
    const updated = await tx.page.update({
      where: {
        id: pageWithDiffs.id
      },
      data: {
        content: contentAfterUpdate,
        version: validVersion ? version : undefined
      }
    });

    if (validVersion) {
      await tx.pageDiff.deleteMany({
        where: {
          pageId,
          version: {
            gt: version
          }
        }
      });
    }

    return updated;
  });

  log.debug(`Rebuilt document with ${pageWithDiffs.diffs.length} steps`);

  return pageAfterUpdate;
}
