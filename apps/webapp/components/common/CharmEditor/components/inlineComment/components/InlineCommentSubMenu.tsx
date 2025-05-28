import type { PageType } from '@charmverse/core/prisma-client';
import { styled } from '@mui/material';
import { Paper } from '@mui/material';
import type { PluginKey } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';

import { useCreateThread } from 'charmClient/hooks/comments';
import type { InlineCommentInputHandleSubmitParams } from 'components/[pageId]/DocumentPage/components/InlineCommentInput';
import { InlineCommentInput } from 'components/[pageId]/DocumentPage/components/InlineCommentInput';
import { useInlineComment } from 'hooks/useInlineComment';
import { useThreads } from 'hooks/useThreads';

import { useEditorViewContext } from '../../../components/@bangle.dev/react/hooks';
import { hideSelectionTooltip } from '../../../components/@bangle.dev/tooltip/selectionTooltip';
import { updateInlineComment } from '../inlineComment.utils';

export const ThreadContainer = styled(Paper)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  flex-direction: column;
  overflow: auto;
  width: calc(100vw - ${({ theme }) => theme.spacing(1)});
  margin: ${({ theme }) => theme.spacing(0.5)};
  max-height: 60vh;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    width: 100%;
    min-width: 500px;
    max-height: 400px;
  }
`;

export function InlineCommentSubMenu({
  pageType,
  pluginKey,
  pageId
}: {
  pageType?: 'post' | PageType;
  pluginKey: PluginKey;
  pageId: string | undefined;
}) {
  const view = useEditorViewContext();
  const { trigger: createThread } = useCreateThread();
  const { extractTextFromSelection, updateThreadPluginState } = useInlineComment(view);
  const { refetchThreads } = useThreads();

  const handleSubmit = async ({ commentContent, event, threadAccessGroups }: InlineCommentInputHandleSubmitParams) => {
    if (pageId) {
      event.preventDefault();
      const threadWithComment = await createThread({
        comment: commentContent,
        context: extractTextFromSelection(),
        pageId,
        accessGroups: threadAccessGroups.map((threadAccessGroup) => ({
          id: threadAccessGroup.id,
          group: threadAccessGroup.group
        }))
      });
      // just refetch threads for now to make sure member is attached properly - optimize later by not needing to append members to output of useThreads
      await refetchThreads();
      if (threadWithComment) {
        updateThreadPluginState({
          remove: false,
          threadId: threadWithComment.id
        });
        updateInlineComment(threadWithComment.id)(view.state, view.dispatch);
        hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view);
        const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)));
        view.dispatch(tr);
        view.focus();
      }
    }
  };

  return <InlineCommentInput handleSubmit={handleSubmit} pageType={pageType} />;
}
