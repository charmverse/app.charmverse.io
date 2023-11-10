import { selectionTooltip } from '@bangle.dev/tooltip';
import type { PageType } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import type { Theme } from '@mui/material';
import { Box, Divider, Paper, Stack, Typography, useMediaQuery } from '@mui/material';
import dynamic from 'next/dynamic';
import type { PluginKey } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';
import React, { useState } from 'react';

import { useCreateThread } from 'charmClient/hooks/comments';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { Button } from 'components/common/Button';
import { useEditorViewContext } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import FieldLabel from 'components/common/form/FieldLabel';
import { useInlineComment } from 'hooks/useInlineComment';
import { useThreads } from 'hooks/useThreads';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { ThreadAccessGroup } from 'lib/threads';

import { updateInlineComment } from '../inlineComment.utils';

export const InlineCharmEditor = dynamic(() => import('components/common/CharmEditor/InlineCharmEditor'), {
  ssr: false
});

const hideSelectionTooltip = selectionTooltip.hideSelectionTooltip;

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
  const [commentContent, setCommentContent] = useState<PageContent>({
    type: 'doc',
    content: [
      {
        type: 'paragraph'
      }
    ]
  });
  const [threadAccessGroups, setThreadAccessGroups] = useState<ThreadAccessGroup[]>([]);

  const { trigger: createThread, isMutating } = useCreateThread();
  const { extractTextFromSelection, updateThreadPluginState } = useInlineComment();
  const { refetchThreads } = useThreads();
  const isEmpty = checkIsContentEmpty(commentContent);
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  const handleSubmit = async (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (!isEmpty && pageId) {
      e.preventDefault();
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
      refetchThreads();
      // setThreads((_threads) => ({ ..._threads, [threadWithComment.id]: threadWithComment }));
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

  return (
    <Box width='100%'>
      {pageType === 'proposal' && (
        <Stack height='fit-content' my={0.5}>
          <Stack flexDirection='row' gap={0.5} m={0.5} alignItems='center'>
            <PersonIcon fontSize='small' color='secondary' />
            <Typography variant='subtitle2'>Viewable by:</Typography>
          </Stack>
          <UserAndRoleSelect
            wrapColumn
            emptyPlaceholderContent='Everyone'
            readOnlyMessage='Everyone'
            value={threadAccessGroups}
            onChange={setThreadAccessGroups}
          />
          <Divider />
        </Stack>
      )}
      <Box display='flex' width={{ xs: '100%', sm: '400px' }}>
        <Box flexGrow={1}>
          <InlineCharmEditor
            focusOnInit={true}
            content={commentContent}
            style={{
              fontSize: '14px',
              minHeight: 100
            }}
            onContentChange={({ doc }) => {
              setCommentContent(doc);
            }}
          />
        </Box>
        <Button
          disabled={isEmpty || isMutating}
          size='small'
          onClick={handleSubmit}
          sx={{
            alignSelf: 'flex-end',
            marginBottom: '4px',
            minWidth: ['36px', '64px'],
            px: ['4px', '10px']
          }}
        >
          {isSmallScreen ? <SendIcon /> : 'Start'}
        </Button>
      </Box>
    </Box>
  );
}
