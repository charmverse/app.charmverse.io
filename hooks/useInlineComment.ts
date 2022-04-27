import { Node, Mark, MarkType } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { findChildrenByMark, NodeWithPos } from 'prosemirror-utils';
import { useContributors } from './useContributors';
import { usePages } from './usePages';
import { useThreads } from './useThreads';

export function useInlineComment () {
  const view = useEditorViewContext();
  const { pages } = usePages();
  const [contributors] = useContributors();
  const { threads } = useThreads();

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
    findTotalInlineComments (node: Node) {
      const inlineCommentMarkSchema = view.state.schema.marks['inline-comment'] as MarkType;
      const inlineCommentNodes = findChildrenByMark(node, inlineCommentMarkSchema);
      let totalInlineComments = 0;
      const threadIds: string[] = [];
      for (const inlineCommentNode of inlineCommentNodes) {
        // Find the inline comment mark for the node
        const inlineCommentMark = inlineCommentNode.node.marks.find(mark => mark.type.name === inlineCommentMarkSchema.name);
        // Make sure the mark has the same threadId as the given one
        if (inlineCommentMark && !inlineCommentMark.attrs.resolved) {
          threadIds.push(inlineCommentMark.attrs.id);
          const thread = threads[inlineCommentMark.attrs.id];
          if (thread) {
            totalInlineComments += thread.Comment.length;
          }
        }
      }
      return { totalInlineComments, threadIds };
    },
    removeInlineCommentMark (threadId: string, deleteThread?: boolean) {
      deleteThread = deleteThread ?? false;
      const doc = view.state.doc;
      const inlineCommentMarkSchema = view.state.schema.marks['inline-comment'] as MarkType;
      const inlineCommentNodes = findChildrenByMark(doc, inlineCommentMarkSchema);
      const inlineCommentNodeWithMarks: (NodeWithPos & {mark: Mark})[] = [];

      for (const inlineCommentNode of inlineCommentNodes) {
        // Find the inline comment mark for the node
        const inlineCommentMark = inlineCommentNode.node.marks.find(mark => mark.type.name === inlineCommentMarkSchema.name);
        // Make sure the mark has the same threadId as the given one
        if (inlineCommentMark?.attrs.id === threadId) {
          inlineCommentNodeWithMarks.push({
            ...inlineCommentNode,
            mark: inlineCommentMark
          });
        }
      }

      inlineCommentNodeWithMarks.forEach(inlineCommentNodeWithMark => {
        const from = inlineCommentNodeWithMark.pos;
        const to = from + inlineCommentNodeWithMark.node.nodeSize;
        const tr = view.state.tr.removeMark(from, to, inlineCommentMarkSchema);
        // If we are not deleting the thread, resolve or un-resolve it based on current re-solve status
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
      });
    }
  };
}
