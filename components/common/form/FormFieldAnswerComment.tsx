import { MessageOutlined } from '@mui/icons-material';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { isTruthy } from '@packages/utils/types';
import { useState } from 'react';

import { useCreateThread } from 'charmClient/hooks/comments';
import type { InlineCommentInputHandleSubmitParams } from 'components/[pageId]/DocumentPage/components/InlineCommentInput';
import { InlineCommentInput } from 'components/[pageId]/DocumentPage/components/InlineCommentInput';
import { usePageSidebar } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { useThreads } from 'hooks/useThreads';
import type { ThreadWithComments } from 'lib/threads/interfaces';
import { highlightDomElement } from 'lib/utils/browser';

import { ThreadContainer } from '../CharmEditor/components/inlineComment/components/InlineCommentSubMenu';
import PageThread from '../CharmEditor/components/thread/PageThread';
import PopperPopup from '../PopperPopup';

function FormFieldAnswerCommentsCounter({
  disabled,
  unResolvedThreads
}: {
  disabled?: boolean;
  unResolvedThreads: ThreadWithComments[];
}) {
  const { activeView: sidebarView } = usePageSidebar();
  return (
    <Tooltip title={!disabled ? 'View comments' : ''}>
      <Box
        display='flex'
        gap={{
          md: 0.5,
          xs: 0.25
        }}
        alignItems='center'
        sx={{ cursor: 'pointer' }}
        onClick={() => {
          if (sidebarView === 'comments') {
            const firstUnresolvedThread = unResolvedThreads[0];
            const unresolvedThreadElement = document.getElementById(`thread.${firstUnresolvedThread.id}`);
            if (unresolvedThreadElement) {
              requestAnimationFrame(() => {
                unresolvedThreadElement.scrollIntoView({
                  behavior: 'smooth'
                });

                setTimeout(() => {
                  requestAnimationFrame(() => {
                    highlightDomElement(unresolvedThreadElement as HTMLElement);
                  });
                }, 250);
              });
            }
          }
        }}
      >
        <MessageOutlined
          color='secondary'
          sx={{
            fontSize: {
              md: '1.25rem',
              xs: '1rem'
            }
          }}
        />
        <Typography
          component='span'
          variant='subtitle1'
          sx={{
            position: 'relative',
            top: -2,
            fontSize: {
              md: '1rem',
              xs: '0.75rem'
            }
          }}
        >
          {unResolvedThreads.reduce((acc, thread) => acc + thread.comments.length, 0)}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function FormFieldAnswerThreads({
  disabled,
  fieldAnswerThreads = []
}: {
  disabled?: boolean;
  fieldAnswerThreads?: ThreadWithComments[];
}) {
  const { activeView: sidebarView } = usePageSidebar();
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

  if (sidebarView === 'comments') {
    return <FormFieldAnswerCommentsCounter disabled={disabled} unResolvedThreads={unResolvedThreads} />;
  }

  return (
    <PopperPopup
      popupContent={
        <Box
          display='flex'
          flexDirection='column'
          gap={1}
          sx={{
            p: 1,
            '& > .MuiPaper-root': {
              background: 'transparent',
              boxShadow: 'none',
              margin: 0
            }
          }}
        >
          {unResolvedThreads.map((resolvedThread) => (
            <ThreadContainer key={resolvedThread.id} elevation={4}>
              <PageThread
                enableComments
                inline
                key={resolvedThread.id}
                threadId={resolvedThread?.id}
                sx={{
                  boxShadow: 'none'
                }}
                hideContext
              />
            </ThreadContainer>
          ))}
        </Box>
      }
      popoverProps={{
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'left'
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'left'
        }
      }}
      disablePopup={disabled}
    >
      <FormFieldAnswerCommentsCounter disabled={disabled} unResolvedThreads={unResolvedThreads} />
    </PopperPopup>
  );
}

export function FormFieldAnswerInput({
  pageId,
  disabled,
  formFieldAnswerId,
  enableComments,
  formFieldName
}: {
  disabled?: boolean;
  pageId: string;
  formFieldAnswerId: string;
  enableComments?: boolean;
  formFieldName: string;
}) {
  const { trigger: createThread } = useCreateThread();
  const { refetchThreads } = useThreads();
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async ({ commentContent, event, threadAccessGroups }: InlineCommentInputHandleSubmitParams) => {
    event.preventDefault();

    await createThread({
      comment: commentContent,
      context: formFieldName,
      pageId,
      accessGroups: threadAccessGroups.map((threadAccessGroup) => ({
        id: threadAccessGroup.id,
        group: threadAccessGroup.group
      })),
      fieldAnswerId: formFieldAnswerId
    });
    await refetchThreads();
    setIsOpen(false);
  };

  if (!enableComments) {
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
      <Tooltip title='Add a comment'>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <AddCommentOutlinedIcon
            sx={{
              cursor: 'pointer',
              fontSize: {
                md: '1.25rem',
                xs: '1rem'
              }
            }}
            color='secondary'
            onClick={() => setIsOpen(true)}
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
  formFieldAnswerId,
  enableComments,
  formFieldName
}: {
  disabled?: boolean;
  pageId: string;
  fieldAnswerThreads?: ThreadWithComments[];
  formFieldAnswerId: string;
  enableComments?: boolean;
  formFieldName: string;
}) {
  return (
    <Stack
      data-test='form-field-answer-comment'
      flexDirection={{
        md: 'row',
        xs: 'column-reverse'
      }}
      gap={{
        md: 1,
        xs: 0.5
      }}
      className={fieldAnswerThreads.length === 0 ? 'icons' : ''}
      position='relative'
      alignItems={{
        md: 'center',
        xs: 'flex-start'
      }}
    >
      <FormFieldAnswerThreads fieldAnswerThreads={fieldAnswerThreads} />
      <span className={fieldAnswerThreads.length !== 0 ? 'icons' : ''}>
        <FormFieldAnswerInput
          formFieldName={formFieldName}
          disabled={disabled}
          pageId={pageId}
          formFieldAnswerId={formFieldAnswerId}
          enableComments={enableComments}
        />
      </span>
    </Stack>
  );
}
