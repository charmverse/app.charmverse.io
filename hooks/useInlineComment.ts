import { Mark, MarkType } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { findChildrenByMark, NodeWithPos } from 'prosemirror-utils';

export function useInlineComment () {
  const view = useEditorViewContext();

  return {
    removeInlineCommentMark (threadId: string, deleteThread?: boolean) {
      deleteThread = deleteThread ?? false;
      const doc = view.state.doc;
      const inlineCommentMarkSchema = view.state.schema.marks['inline-comment'] as MarkType;
      const inlineCommentNodes = findChildrenByMark(doc, inlineCommentMarkSchema);
      let inlineCommentNodeWithMark: (NodeWithPos & {mark: Mark}) | null = null;

      for (const inlineCommentNode of inlineCommentNodes) {
        // Find the inline comment mark for the node
        const inlineCommentMark = inlineCommentNode.node.marks.find(mark => mark.type.name === inlineCommentMarkSchema.name);
        // Make sure the mark has the same threadId as the given one
        if (inlineCommentMark?.attrs.id === threadId) {
          inlineCommentNodeWithMark = {
            ...inlineCommentNode,
            mark: inlineCommentMark
          };
          break;
        }
      }

      if (inlineCommentNodeWithMark) {
        const from = inlineCommentNodeWithMark.pos;
        const to = from + inlineCommentNodeWithMark.node.nodeSize;
        const tr = view.state.tr.removeMark(from, to, inlineCommentMarkSchema);
        // If we are not deleting the thread, resolve or un-resolve it based on current re-sovle status
        // This will update the view accordingly
        if (!deleteThread) {
          tr.addMark(from, to, inlineCommentMarkSchema.create({
            id: threadId,
            resolved: !inlineCommentNodeWithMark.mark.attrs.resolved
          }));
        }
        if (view.dispatch) {
          view.dispatch(tr);
        }
      }
    }
  };
}
