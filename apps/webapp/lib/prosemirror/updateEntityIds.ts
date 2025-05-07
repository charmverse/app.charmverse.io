import { log } from '@charmverse/core/log';
import type { Page } from '@charmverse/core/prisma';
import type { PageContent, TextContent, TextMark } from 'lib/prosemirror/interfaces';
import { v4 as uuid } from 'uuid';

type UpdateRefs = {
  oldNewRecordIdHashMap: Record<string, string>;
  pages: Pick<Page, 'content' | 'id'>[];
};

/**
 * Mutates the provided content to replace nested references to pages, polls, etc.
 */
export function updateEntityIds({ oldNewRecordIdHashMap, pages }: UpdateRefs) {
  const extractedPolls = _getExtractedPollsMap();

  for (const page of pages) {
    _recursivelyUpdate(page.content as PageContent, (node) =>
      _updateNode(node, { pollPageId: page.id, oldNewRecordIdHashMap, extractedPolls })
    );
  }

  return {
    extractedPolls
  };
}

function _recursivelyUpdate(node: PageContent, cb: (node: PageContent | TextContent) => void) {
  if (node?.content) {
    node?.content.forEach((childNode) => {
      _recursivelyUpdate(childNode, cb);
    });
  }
  if (node) {
    cb(node);
  }
}

export function _getExtractedPollsMap() {
  return new Map<string, { pageId: string; newPollId: string; originalId: string }>();
}

export function _updateNode(
  node: PageContent | TextContent,
  {
    pollPageId,
    oldNewRecordIdHashMap,
    extractedPolls
  }: {
    pollPageId: string;
    oldNewRecordIdHashMap: Record<string, string>;
    extractedPolls: Map<string, { pageId: string; newPollId: string; originalId: string }>;
  }
) {
  if (node.type === 'poll') {
    const attrs = node.attrs as { pollId: string };
    if (attrs.pollId) {
      const newPollId = uuid();
      extractedPolls.set(attrs.pollId, { newPollId, pageId: pollPageId, originalId: attrs.pollId });
      attrs.pollId = newPollId;
    }
  } else if (node.type === 'page' || node.type === 'linkedPage') {
    const attrs = node.attrs as { id: string };
    const oldPageId = attrs.id;
    let newPageId = oldPageId ? oldNewRecordIdHashMap[oldPageId] : undefined;

    if (oldPageId && !newPageId) {
      newPageId = uuid();
      // Not sure when this case should actually ever occur, seems like an invalid/error state? - Matt
      log.warn('Generating new page Id for copied page link', { pageId: oldPageId, newPageId });
      oldNewRecordIdHashMap[oldPageId] = newPageId;
      oldNewRecordIdHashMap[newPageId] = oldPageId;
    }
    if (oldPageId && newPageId) {
      attrs.id = newPageId;
    }
  } else if (node.type === 'mention' && node.attrs?.type === 'page') {
    const attrs = node.attrs as { value: string };
    const oldPageId = attrs.value;
    let newPageId = oldPageId ? oldNewRecordIdHashMap[oldPageId] : undefined;

    if (oldPageId && !newPageId) {
      newPageId = uuid();
      // Not sure when this case should actually ever occur, seems like an invalid/error state? - Matt
      log.warn('Generating new page Id for copied page mention', { pageId: oldPageId, newPageId });
      oldNewRecordIdHashMap[oldPageId] = newPageId;
      oldNewRecordIdHashMap[newPageId] = oldPageId;
    }
    if (oldPageId && newPageId) {
      attrs.value = newPageId;
    }
  } else if (node.type === 'inlineDatabase') {
    const attrs = node.attrs as { pageId: string };
    const oldPageId = attrs.pageId;
    let newPageId = oldPageId ? oldNewRecordIdHashMap[oldPageId] : undefined;

    if (oldPageId && !newPageId) {
      newPageId = uuid();
      oldNewRecordIdHashMap[oldPageId] = newPageId;
      oldNewRecordIdHashMap[newPageId] = oldPageId;
    }

    if (oldPageId && newPageId) {
      attrs.pageId = newPageId;
    }
  }

  const marks: TextMark[] = node.marks;

  if (marks) {
    node.marks = marks.filter((mark) => mark.type !== 'inline-comment');
  }
}
