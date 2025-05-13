import { InsecureOperationError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { getNodeFromJson } from '@packages/bangleeditor/getNodeFromJson';

import { extractRuUrls } from './extractRuUrls';

const unsafeUrlMessage = 'Page contains potentially unsafe URLs';

export function checkPageContent(
  pageContent: any | null,
  meta: { spaceId?: string; blockId?: string; postId?: string; pageId?: string } = {}
): void {
  if (pageContent && pageContent.content) {
    const doc = getNodeFromJson(pageContent);
    if (doc) {
      doc.nodesBetween(0, doc.content.size, (node) => {
        if (
          extractRuUrls(node.text ?? '').length ||
          extractRuUrls(node.attrs.href ?? '').length ||
          node.marks.some((mark) => extractRuUrls(mark.attrs.href ?? '').length)
        ) {
          // assume that spaceId is passed if we care about logging
          log.warn('Error counting prosemirror blocks', {
            error: unsafeUrlMessage,
            pageContent,
            ...meta
          });
          throw new InsecureOperationError(unsafeUrlMessage);
        }
      });
    }
  }
}
