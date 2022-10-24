import type { Node } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';

import { extractTextFromSelection } from 'lib/inline-comments/extractTextFromSelection';
import { findTotalInlineComments } from 'lib/inline-comments/findTotalInlineComments';
import { removeInlineCommentMark } from 'lib/inline-comments/removeInlineCommentMark';

import { useMembers } from './useMembers';
import { usePages } from './usePages';
import { useThreads } from './useThreads';

export function useInlineComment () {
  const view = useEditorViewContext();
  const { pages } = usePages();
  const { members } = useMembers();
  const { threads } = useThreads();

  return {
    extractTextFromSelection () {
      return extractTextFromSelection(view, members, pages);
    },
    findTotalInlineComments (node: Node, keepResolved?: boolean) {
      return findTotalInlineComments(view.state.schema, node, threads, keepResolved);
    },
    removeInlineCommentMark (threadId: string, deleteThread?: boolean) {
      removeInlineCommentMark(view, threadId, deleteThread);
    }
  };
}
