import type { Prisma } from '@charmverse/core/prisma';
import { emptyDocument } from 'lib/prosemirror/constants';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { ClientDiffMessage } from 'lib/websockets/documentEvents/interfaces';

/**
 * @createdBy - Should be provided from the creator of the page
 *
 * @content - Prosemirror-compliant JSON document. Typed as null to make it easier for consumers
 */
type SyntheticDiffInput = {
  createdBy: string;
  content?: PageContent | any;
};

/**
 * When creating a page, we should save the initial content as first diff so that is it replayable
 */
export function generateFirstDiff({
  content,
  createdBy
}: SyntheticDiffInput): Pick<Prisma.PageDiffCreateInput, 'createdBy' | 'version' | 'data'> {
  // When initialising the page we expect a root node with "type: doc" Here, we extract the inner content to create an actual prosemirror step
  const firstStep = content?.content ?? emptyDocument.content;

  const rawDiff: ClientDiffMessage = {
    rid: 0,
    type: 'diff',
    v: 0,
    cid: 0,
    ds: [
      {
        from: 0,
        to: 0,
        stepType: 'replace',
        slice: firstStep as any
      }
    ]
  };
  return {
    createdBy,
    data: rawDiff as any as Prisma.InputJsonObject,
    version: 0
  };
}
