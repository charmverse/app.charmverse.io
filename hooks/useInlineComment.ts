import { Node } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { extractTextFromSelection } from 'lib/inline-comments/extractTextFromSelection';
import { findTotalInlineComments } from 'lib/inline-comments/findTotalInlineComments';
import { removeInlineCommentMark } from 'lib/inline-comments/removeInlineCommentMark';
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
      return extractTextFromSelection(view, contributors, pages);
    },
    findTotalInlineComments (node: Node) {
      return findTotalInlineComments(view, node, threads);
    },
    removeInlineCommentMark (threadId: string, deleteThread?: boolean) {
      removeInlineCommentMark(view, threadId, deleteThread);
    }
  };
}
