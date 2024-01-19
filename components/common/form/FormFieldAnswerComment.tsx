import type { FormFieldAnswer } from '@charmverse/core/prisma-client';
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

import type { FormFieldValue } from './interfaces';

export function FormFieldAnswerComment({
  pageId,
  disabled,
  isReviewer,
  fieldAnswerThread,
  formFieldAnswer
}: {
  isReviewer: boolean;
  disabled?: boolean;
  pageId: string;
  fieldAnswerThread?: ThreadWithComments | null;
  formFieldAnswer: FormFieldAnswer;
}) {
  const formFieldAnswerValue = formFieldAnswer.value as FormFieldValue;
  let value = Array.isArray(formFieldAnswerValue) ? formFieldAnswerValue[0] : formFieldAnswerValue;
  value = typeof value === 'object' ? value.contentText : value;

  const { trigger: createThread } = useCreateThread();
  const { refetchThreads } = useThreads();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const handleSubmit = async ({ commentContent, event, threadAccessGroups }: InlineCommentInputHandleSubmitParams) => {
    event.preventDefault();
    await createThread({
      comment: commentContent,
      context: value,
      pageId,
      accessGroups: threadAccessGroups.map((threadAccessGroup) => ({
        id: threadAccessGroup.id,
        group: threadAccessGroup.group
      })),
      fieldAnswerId: formFieldAnswer.id
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
          <IconButton disabled={!isReviewer || disabled} color='secondary' onClick={() => setIsPopoverOpen(true)}>
            <AddCommentOutlinedIcon fontSize='small' />
          </IconButton>
        )}
      </Tooltip>
    </PopperPopup>
  );
}
