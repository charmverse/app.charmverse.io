import type { FormFieldAnswer } from '@charmverse/core/prisma-client';
import { MessageOutlined } from '@mui/icons-material';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';

import { useCreateThread } from 'charmClient/hooks/comments';
import type { InlineCommentInputHandleSubmitParams } from 'components/[pageId]/DocumentPage/components/InlineCommentInput';
import { InlineCommentInput } from 'components/[pageId]/DocumentPage/components/InlineCommentInput';
import { useThreads } from 'hooks/useThreads';
import type { ThreadWithComments } from 'lib/threads/interfaces';
import { isTruthy } from 'lib/utilities/types';

import { ThreadContainer } from '../CharmEditor/components/inlineComment/components/InlineCommentSubMenu';
import PageThread from '../CharmEditor/components/thread/PageThread';
import PopperPopup from '../PopperPopup';

import type { FormFieldValue } from './interfaces';

function FormFieldAnswerThreads({
  disabled,
  fieldAnswerThreads = []
}: {
  disabled?: boolean;
  fieldAnswerThreads?: ThreadWithComments[];
}) {
  const unResolvedThreads =
    fieldAnswerThreads
      .filter((thread) => thread && !thread?.resolved)
      .filter(isTruthy)
      .sort((threadA, threadB) =>
        threadA && threadB ? new Date(threadB.createdAt).getTime() - new Date(threadA.createdAt).getTime() : 0
      ) ?? [];

  if (fieldAnswerThreads.length === 0 || unResolvedThreads.length === 0) {
    return null;
  }

  return (
    <PopperPopup
      popupContent={
        <Box display='flex' flexDirection='column' gap={1}>
          {unResolvedThreads.map((resolvedThread) => (
            <ThreadContainer key={resolvedThread.id} elevation={4}>
              <PageThread
                canCreateComments
                inline
                key={resolvedThread.id}
                threadId={resolvedThread?.id}
                sx={{
                  boxShadow: 'none'
                }}
              />
            </ThreadContainer>
          ))}
        </Box>
      }
      disablePopup={disabled}
      paperSx={{
        boxShadow: 'none'
      }}
    >
      <Tooltip title={!disabled ? 'View form field answer threads' : ''}>
        <Box display='flex' gap={0.5} alignItems='center' sx={{ cursor: 'pointer' }}>
          <MessageOutlined color='secondary' fontSize='small' />
          <Typography
            component='span'
            variant='subtitle1'
            sx={{
              position: 'relative',
              top: -2
            }}
          >
            {unResolvedThreads.reduce((acc, thread) => acc + thread.comments.length, 0)}
          </Typography>
        </Box>
      </Tooltip>
    </PopperPopup>
  );
}

export function FormFieldAnswerInput({
  pageId,
  disabled,
  formFieldAnswer,
  canCreateComments
}: {
  disabled?: boolean;
  pageId: string;
  formFieldAnswer: FormFieldAnswer;
  canCreateComments?: boolean;
}) {
  const formFieldAnswerValue = formFieldAnswer.value as FormFieldValue;
  const { trigger: createThread } = useCreateThread();
  const { refetchThreads } = useThreads();
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async ({ commentContent, event, threadAccessGroups }: InlineCommentInputHandleSubmitParams) => {
    event.preventDefault();
    const value = Array.isArray(formFieldAnswerValue) ? formFieldAnswerValue[0] : formFieldAnswerValue;

    await createThread({
      comment: commentContent,
      context: (typeof value === 'object' ? value.contentText : value) as string,
      pageId,
      accessGroups: threadAccessGroups.map((threadAccessGroup) => ({
        id: threadAccessGroup.id,
        group: threadAccessGroup.group
      })),
      fieldAnswerId: formFieldAnswer.id
    });
    await refetchThreads();
    setIsOpen(false);
  };

  if (!canCreateComments) {
    return null;
  }

  return (
    <PopperPopup
      popupContent={<InlineCommentInput pageType='proposal' handleSubmit={handleSubmit} />}
      disablePopup={disabled}
      paperSx={{
        boxShadow: 'none'
      }}
      open={isOpen}
    >
      <Tooltip
        title={!disabled ? 'Add a comment to the form field answer' : "You don't have permission to add a comment"}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <AddCommentOutlinedIcon
            sx={{ cursor: 'pointer' }}
            color='secondary'
            onClick={() => setIsOpen(true)}
            fontSize='small'
          />
        </Box>
      </Tooltip>
    </PopperPopup>
  );
}

export function FormFieldAnswerComment({
  pageId,
  disabled,
  fieldAnswerThreads = [],
  formFieldAnswer,
  canCreateComments
}: {
  disabled?: boolean;
  pageId: string;
  fieldAnswerThreads?: ThreadWithComments[];
  formFieldAnswer: FormFieldAnswer;
  canCreateComments?: boolean;
}) {
  return (
    <Stack flexDirection='row' gap={1} className='icons' position='relative' alignItems='center'>
      <FormFieldAnswerThreads fieldAnswerThreads={fieldAnswerThreads} />
      <FormFieldAnswerInput
        disabled={disabled}
        pageId={pageId}
        formFieldAnswer={formFieldAnswer}
        canCreateComments={canCreateComments}
      />
    </Stack>
  );
}
