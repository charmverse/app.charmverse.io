import { isTruthy } from '@packages/utils/types';
import type { Node } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';

import { threadPluginKey } from 'components/common/CharmEditor/components/thread/thread.plugins';
import { extractTextFromSelection } from 'lib/prosemirror/plugins/inlineComments/extractTextFromSelection';
import { findTotalInlineComments } from 'lib/prosemirror/plugins/inlineComments/findTotalInlineComments';
import { removeInlineCommentMark } from 'lib/prosemirror/plugins/inlineComments/removeInlineCommentMark';

import { useMembers } from './useMembers';
import { usePages } from './usePages';
import { useThreads } from './useThreads';

export function useInlineComment(view: EditorView | null) {
  const { pages } = usePages();
  const { getMemberById } = useMembers();
  const { threads } = useThreads();

  return {
    updateThreadPluginState({ remove, threadId }: { threadId: string; remove: boolean }) {
      const filteredThreadIds = Object.values(threads)
        .filter(isTruthy)
        .filter((thread) => !thread.resolved)
        .map((thread) => thread.id);
      view?.dispatch(
        view.state.tr.setMeta(
          threadPluginKey,
          remove ? filteredThreadIds.filter((_threadId) => _threadId !== threadId) : [...filteredThreadIds, threadId]
        )
      );
    },
    extractTextFromSelection() {
      if (!view) throw new Error('Editor view is not available');
      return extractTextFromSelection(view, getMemberById, pages);
    },
    findTotalInlineComments(node: Node, keepResolved?: boolean) {
      if (!view) throw new Error('Editor view is not available');
      return findTotalInlineComments(view.state.schema, node, threads, keepResolved);
    },
    removeInlineCommentMark(threadId: string, deleteThread?: boolean) {
      if (!view) throw new Error('Editor view is not available');
      removeInlineCommentMark(view, threadId, deleteThread);
    }
  };
}
