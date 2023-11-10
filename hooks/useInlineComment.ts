import type { Node } from '@bangle.dev/pm';

import { useEditorViewContext } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import { threadPluginKey } from 'components/common/CharmEditor/plugins';
import { extractTextFromSelection } from 'lib/prosemirror/plugins/inlineComments/extractTextFromSelection';
import { findTotalInlineComments } from 'lib/prosemirror/plugins/inlineComments/findTotalInlineComments';
import { removeInlineCommentMark } from 'lib/prosemirror/plugins/inlineComments/removeInlineCommentMark';
import { isTruthy } from 'lib/utilities/types';

import { useMembers } from './useMembers';
import { usePages } from './usePages';
import { useThreads } from './useThreads';

export function useInlineComment() {
  const view = useEditorViewContext();
  const { pages } = usePages();
  const { getMemberById } = useMembers();
  const { threads } = useThreads();

  return {
    updateThreadPluginState({ remove, threadId }: { threadId: string; remove: boolean }) {
      view.dispatch(
        view.state.tr.setMeta(
          threadPluginKey,
          remove
            ? Object.keys(threads)
                .filter(isTruthy)
                .map((_threadId) => _threadId !== threadId)
            : [...Object.keys(threads).filter(isTruthy), threadId]
        )
      );
    },
    extractTextFromSelection() {
      return extractTextFromSelection(view, getMemberById, pages);
    },
    findTotalInlineComments(node: Node, keepResolved?: boolean) {
      return findTotalInlineComments(view.state.schema, node, threads, keepResolved);
    },
    removeInlineCommentMark(threadId: string, deleteThread?: boolean) {
      removeInlineCommentMark(view, threadId, deleteThread);
    }
  };
}
