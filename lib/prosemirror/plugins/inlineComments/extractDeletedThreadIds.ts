import type { MarkType, Node, Schema } from 'prosemirror-model';
import type { NodeWithPos } from 'prosemirror-utils';
import { findChildrenByMark } from 'prosemirror-utils';

function extractThreadIds(inlineCommentNodes: NodeWithPos[]) {
  const threadIds: Set<string> = new Set();
  inlineCommentNodes.forEach((inlineCommentNode) => {
    const marks = inlineCommentNode.node.marks;
    if (marks) {
      marks.forEach((mark) => {
        if (mark.type.name === 'inline-comment') {
          threadIds.add(mark.attrs.id);
        }
      });
    }
  });

  return threadIds;
}

export function extractThreadIdsFromDoc(doc: Node, schema: Schema) {
  const inlineCommentMarkSchema = schema.marks['inline-comment'] as MarkType;
  const inlineCommentNodes = findChildrenByMark(doc, inlineCommentMarkSchema);
  return extractThreadIds(inlineCommentNodes);
}

export function extractDeletedThreadIds(schema: Schema, curDoc: Node, prevDoc: Node) {
  const prevDocThreadIds = extractThreadIdsFromDoc(prevDoc, schema);
  const curDocThreadIds = extractThreadIdsFromDoc(curDoc, schema);

  const deletedThreadIds: string[] = [];
  prevDocThreadIds.forEach((prevDocThreadId) => {
    if (!curDocThreadIds.has(prevDocThreadId)) {
      deletedThreadIds.push(prevDocThreadId);
    }
  });
  return deletedThreadIds;
}
