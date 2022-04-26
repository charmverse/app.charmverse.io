import { useEditorViewContext } from '@bangle.dev/react';
import { findChildrenByMark } from 'prosemirror-utils';

export function useInlineComment () {
  const view = useEditorViewContext();

  return {
    removeInlineCommentMark (threadId: string) {
      const doc = view.state.doc;
      const inlineCommentMarkSchema = view.state.schema.marks['inline-comment'];
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
        if (view.dispatch) {
          view.dispatch(tr);
        }
      }
    }
  };
}
