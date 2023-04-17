import { PageDiff } from "@prisma/client";
import { PageContent } from "lib/prosemirror/interfaces";
import { applyStepsToNode } from 'lib/prosemirror/applyStepsToNode';
import type { ProsemirrorJSONStep } from 'lib/websockets/documentEvents/interfaces';
import { getNodeFromJson } from "lib/prosemirror/getNodeFromJson";
import { prisma } from "db";
import { InvalidInputError } from "lib/utilities/errors";
import fs from 'node:fs/promises'

export function replayDocumentHistory(diffs: PageDiff[]): PageContent {
  const basePageContent: PageContent = {
    type: 'doc',
    content: [{type: 'paragraph', content: []}]
  }

  const sortedDiffs = diffs
    // Make sure diffs are in correct order
    .sort((a, b) => a.version - b.version)
    // Extract prosemirror change step
    .map(diff => (diff.data as any).ds as ProsemirrorJSONStep)
    // Diff ds is stored as an array, unwind this
    .flat()
    // Just in case there are some null diffs
    .filter(diff => !!diff);

  const pageNode = getNodeFromJson(basePageContent);

  const contentAfterReplay = applyStepsToNode(sortedDiffs, pageNode)

  return contentAfterReplay as any;
}


export async function restoreDoc() {
  const pageWithDiffs = await prisma.page.findFirst({
    where: {
      path: `page-12890905063646585`
    },
    select: {
      id: true,
      author: true,
      diffs: {
        orderBy: {
          version: 'asc'
        }
      }
    }
  });
  //Comment
  await fs.writeFile(`${__dirname}/out.json`, JSON.stringify(pageWithDiffs, null, 2));

  if (!pageWithDiffs) {
    throw new InvalidInputError(`Page not found`);
  }

  const contentAfterUpdate = replayDocumentHistory(pageWithDiffs?.diffs ?? [])


  await prisma.page.update({where: {
    id: pageWithDiffs.id,
  }, data: {
    content: contentAfterUpdate
  }});

  console.log(`Rebuilt document with ${pageWithDiffs.diffs.length} steps`)

}
