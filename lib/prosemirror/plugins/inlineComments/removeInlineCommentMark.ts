import { isTruthy } from '@packages/lib/utils/types';
import type { Mark, MarkType } from 'prosemirror-model';
import type { NodeWithPos } from 'prosemirror-utils';
import { findChildrenByMark } from 'prosemirror-utils';
import type { EditorView } from 'prosemirror-view';

export function removeInlineCommentMark(view: EditorView, threadId: string, deleteThread?: boolean) {
  deleteThread = deleteThread ?? false;
  const doc = view.state.doc;
  const inlineCommentMarkSchema = view.state.schema.marks['inline-comment'] as MarkType;

  const inlineCommentNodes = findChildrenByMark(doc, inlineCommentMarkSchema);

  const inlineCommentNodesWithMarks: (NodeWithPos & { mark: Mark })[] = inlineCommentNodes
    .map((inlineCommentNode) => {
      // Find the inline comment mark for the node
      const inlineCommentMark = inlineCommentNode.node.marks.find(
        (mark) =>
          mark.type.name === inlineCommentMarkSchema.name &&
          // Make sure the mark has the same threadId as the given one
          mark.attrs.id === threadId
      );

      if (inlineCommentMark) {
        return {
          ...inlineCommentNode,
          mark: inlineCommentMark
        };
      }
      return null;
    })
    .filter(isTruthy);

  const { tr } = view.state;

  inlineCommentNodesWithMarks.forEach((inlineCommentNodeWithMark) => {
    const from = inlineCommentNodeWithMark.pos;
    const to = from + inlineCommentNodeWithMark.node.nodeSize;
    tr.removeMark(from, to, inlineCommentMarkSchema);
    // If we are not deleting the thread, resolve or un-resolve it based on current re-solve status
    // This will update the view accordingly
    if (!deleteThread) {
      tr.addMark(
        from,
        to,
        inlineCommentMarkSchema.create({
          id: threadId,
          resolved: !inlineCommentNodeWithMark.mark.attrs.resolved
        })
      );
    }
  });

  if (view.dispatch) {
    view.dispatch(tr);
  }
}
