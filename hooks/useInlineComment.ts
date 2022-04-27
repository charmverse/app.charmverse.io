import { Mark, MarkType } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { findChildrenByMark, NodeWithPos } from 'prosemirror-utils';
import { useContributors } from './useContributors';
import { usePages } from './usePages';

export function useInlineComment () {
  const view = useEditorViewContext();
  const { pages } = usePages();
  const [contributors] = useContributors();

  return {
    extractTextFromSelection () {
      // Get the context from current selection
      const cutDoc = view.state.doc.cut(view.state.selection.from, view.state.selection.to);
      let textContent = '';
      cutDoc.descendants(node => {
        if (node.isText) {
          textContent += node.text;
        }
        else if (node.type.name === 'mention') {
          const { type, value } = node.attrs;
          if (type === 'user') {
            const contributor = contributors.find(_contributor => _contributor.id === value);
            if (contributor) {
              textContent += `@${(contributor.username ?? contributor.addresses[0])}`;
            }
          }
          else {
            const page = pages[value];
            if (page) {
              textContent += `@${page.title}`;
            }
          }
        }
        else if (node.type.name === 'emoji') {
          textContent += node.attrs.emoji;
        }
      });
      return textContent;
    },
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
