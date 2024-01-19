import { MessageOutlined } from '@mui/icons-material';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';

import { useCreateThread } from 'charmClient/hooks/comments';
import type { InlineCommentInputHandleSubmitParams } from 'components/[pageId]/DocumentPage/components/InlineCommentInput';
import { InlineCommentInput } from 'components/[pageId]/DocumentPage/components/InlineCommentInput';
import { useThreads } from 'hooks/useThreads';
import type { ThreadWithComments } from 'lib/threads/interfaces';

import { ThreadContainer } from '../CharmEditor/components/inlineComment/components/InlineCommentSubMenu';
import PageThread from '../CharmEditor/components/thread/PageThread';
import PopperPopup from '../PopperPopup';

export function FormFieldAnswerComment({
  pageId,
  disabled,
  isReviewer,
  fieldAnswerId,
  fieldAnswerThread
}: {
  fieldAnswerId: string;
  isReviewer: boolean;
  disabled?: boolean;
  pageId: string;
  fieldAnswerThread?: ThreadWithComments | null;
}) {
  const { trigger: createThread } = useCreateThread();
  const { refetchThreads } = useThreads();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const handleSubmit = async ({ commentContent, event, threadAccessGroups }: InlineCommentInputHandleSubmitParams) => {
    event.preventDefault();
    await createThread({
      comment: commentContent,
      context: 'Form field answer context',
      pageId,
      accessGroups: threadAccessGroups.map((threadAccessGroup) => ({
        id: threadAccessGroup.id,
        group: threadAccessGroup.group
      })),
      fieldAnswerId
    });
    await refetchThreads();
    setIsPopoverOpen(false);
  };

  return (
    <PopperPopup
      popupContent={
        fieldAnswerThread ? (
          <ThreadContainer
            sx={{
              boxShadow: 'none'
            }}
          >
            <PageThread
              sx={{
                border: 'none'
              }}
              canCreateComments={isReviewer && !disabled}
              inline
              threadId={fieldAnswerThread.id}
            />
          </ThreadContainer>
        ) : (
          <InlineCommentInput pageType='proposal' handleSubmit={handleSubmit} />
        )
      }
      disablePopup={disabled}
      paperSx={{
        boxShadow: 'none'
      }}
      open={isPopoverOpen}
    >
      <Tooltip
        title={
          isReviewer && !disabled
            ? 'Add a comment to the form field answer'
            : "You don't have permission to add a comment"
        }
      >
        {fieldAnswerThread ? (
          <Box display='flex' gap={0.5} alignItems='center' sx={{ cursor: 'pointer' }}>
            <MessageOutlined color='secondary' fontSize='small' />
            <Typography component='span' variant='subtitle1'>
              {fieldAnswerThread.comments.length}
            </Typography>
          </Box>
        ) : (
          <IconButton
            sx={{
              mt: 1
            }}
            disabled={!isReviewer || disabled}
            color='secondary'
            onClick={() => setIsPopoverOpen(true)}
          >
            <AddCommentOutlinedIcon fontSize='small' />
          </IconButton>
        )}
      </Tooltip>
    </PopperPopup>
  );
}
