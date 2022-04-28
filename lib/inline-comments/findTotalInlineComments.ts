import { EditorView, MarkType, Node } from '@bangle.dev/pm';
import { ThreadWithComments } from 'pages/api/pages/[id]/threads';
import { findChildrenByMark } from 'prosemirror-utils';

export function findTotalInlineComments (view:EditorView, node: Node, threads: Record<string, ThreadWithComments | undefined>) {
  const inlineCommentMarkSchema = view.state.schema.marks['inline-comment'] as MarkType;
  const inlineCommentNodes = findChildrenByMark(node, inlineCommentMarkSchema);
  let totalInlineComments = 0;
  // There is a possibility that multiple nodes can have the same threadId so use a set to capture only the unique ones
  const threadIds: Set<string> = new Set();
  for (const inlineCommentNode of inlineCommentNodes) {
    // Find the inline comment mark for the node
    const inlineCommentMark = inlineCommentNode.node.marks.find(mark => mark.type.name === inlineCommentMarkSchema.name);
    // Only count the non-resolved threads
    if (inlineCommentMark && !inlineCommentMark.attrs.resolved) {
      const thread = threads[inlineCommentMark.attrs.id];
      if (thread && !threadIds.has(thread.id)) {
        totalInlineComments += thread.Comment.length;
      }
      threadIds.add(inlineCommentMark.attrs.id);
    }
  }
  return { totalInlineComments, threadIds: Array.from(threadIds) };
}
