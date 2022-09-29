import type { MarkType, Node, Schema } from '@bangle.dev/pm';
import type { NodeWithPos } from 'prosemirror-utils';
import { findChildrenByMark } from 'prosemirror-utils';

function extractThreadIds (inlineCommentNodes: NodeWithPos[]) {
  const threadIds: Set<string> = new Set();
  inlineCommentNodes.forEach(inlineCommentNode => {
    const marks = inlineCommentNode.node.marks;
    if (marks) {
      marks.forEach(mark => {
        if (mark.type.name === 'inline-comment') {
          threadIds.add(mark.attrs.id);
        }
      });
    }
  });

  return threadIds;
}

export function extractDeletedThreadIds (schema: Schema, curDoc: Node, prevDoc: Node) {
  const inlineCommentMarkSchema = schema.marks['inline-comment'] as MarkType;
  const currentDocInlineCommentNodes = findChildrenByMark(curDoc, inlineCommentMarkSchema);
  const prevDocInlineCommentNodes = findChildrenByMark(prevDoc, inlineCommentMarkSchema);

  const prevDocThreadIds = extractThreadIds(prevDocInlineCommentNodes);
  const curDocThreadIds = extractThreadIds(currentDocInlineCommentNodes);

  const deletedThreadIds: string[] = [];
  prevDocThreadIds.forEach(prevDocThreadId => {
    if (!curDocThreadIds.has(prevDocThreadId)) {
      deletedThreadIds.push(prevDocThreadId);
    }
  });
  return deletedThreadIds;
}
