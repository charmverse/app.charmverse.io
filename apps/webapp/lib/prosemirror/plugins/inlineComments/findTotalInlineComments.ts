import type { ThreadWithComments } from '@packages/lib/threads/interfaces';
import type { MarkType, Node, Schema } from 'prosemirror-model';
import { findChildrenByMark, findChildrenByType } from 'prosemirror-utils';

export function findTotalInlineComments(
  schema: Schema,
  node: Node,
  threads: Record<string, ThreadWithComments | undefined>,
  keepResolved?: boolean
) {
  keepResolved = keepResolved ?? false;
  const inlineCommentMarkSchema = schema.marks['inline-comment'] as MarkType;
  const inlineCommentNodes = findChildrenByMark(node, inlineCommentMarkSchema);
  let totalInlineComments = 0;
  // There is a possibility that multiple nodes can have the same threadId so use a set to capture only the unique ones
  const threadIds: Set<string> = new Set();
  for (const inlineCommentNode of inlineCommentNodes) {
    // Find the inline comment mark for the node
    const inlineCommentMark = inlineCommentNode.node.marks.find(
      (mark) => mark.type.name === inlineCommentMarkSchema.name
    );
    // Only count the non-resolved threads
    if (inlineCommentMark && (keepResolved || !inlineCommentMark.attrs.resolved)) {
      const thread = threads[inlineCommentMark.attrs.id];
      if (thread && !threadIds.has(thread.id)) {
        totalInlineComments += thread.comments.length;
      }
      threadIds.add(inlineCommentMark.attrs.id);
    }
  }
  return { totalInlineComments, threadIds: Array.from(threadIds) };
}

// find and group comments by paragraph and heading
export function extractInlineCommentRows(
  schema: Schema,
  node: Node,
  threadIds: string[]
): { pos: number; nodes: Node[] }[] {
  const inlineCommentMarkSchema = schema.marks['inline-comment'] as MarkType;
  const paragraphs = findChildrenByType(node, schema.nodes.paragraph);
  const headings = findChildrenByType(node, schema.nodes.heading);
  return headings
    .concat(paragraphs)
    .map((_node) => ({
      pos: _node.pos,
      nodes: findChildrenByMark(_node.node, inlineCommentMarkSchema)
        .map((nodeWithPos) => nodeWithPos.node)
        .filter((__node) =>
          __node.marks.find(
            (mark) => mark.type.name === 'inline-comment' && threadIds.includes(mark.attrs.id) && !mark.attrs.resolved
          )
        )
    }))
    .filter(({ nodes }) => nodes.length > 0);
}
