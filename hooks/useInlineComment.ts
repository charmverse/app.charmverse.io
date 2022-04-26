import { MarkType } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { findChildrenByMark } from 'prosemirror-utils';

export function useInlineComment () {
  const view = useEditorViewContext();

  return {
    removeInlineCommentMark (threadId: string, resolve?: boolean) {
      resolve = resolve ?? false;
      const doc = view.state.doc;
      const inlineCommentMarkSchema = view.state.schema.marks['inline-comment'] as MarkType;
      const inlineCommentNodes = findChildrenByMark(doc, inlineCommentMarkSchema);
      const inlineCommentNode = inlineCommentNodes.find(({ node }) => {
        // Find the inline comment mark for the node
        const inlineCommentMark = node.marks.find(mark => mark.type.name === inlineCommentMarkSchema.name);
        if (inlineCommentMark) {
          // Make sure the mark has the same threadId as the given one
          return inlineCommentMark.attrs.id === threadId;
        }
        return false;
      });
      if (inlineCommentNode) {
        const from = inlineCommentNode.pos;
        const to = from + inlineCommentNode.node.nodeSize;
        const tr = view.state.tr.removeMark(from, to, inlineCommentMarkSchema);
        // If we are resolving the thread, add the mark back again with resolved set to true
        // This will update the view accordingly
        if (resolve) {
          tr.addMark(from, to, inlineCommentMarkSchema.create({
            id: threadId,
            resolved: true
          }));
        }
        if (view.dispatch) {
          view.dispatch(tr);
        }
      }
    }
  };
}
