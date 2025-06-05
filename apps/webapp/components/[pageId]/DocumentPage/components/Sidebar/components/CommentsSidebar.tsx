import type { FormField } from '@charmverse/core/prisma-client';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import type { SelectProps } from '@mui/material';
import { styled, Box, InputLabel, List, MenuItem, Select, Typography } from '@mui/material';
import { specRegistry } from '@packages/bangleeditor/specRegistry';
import { checkIsContentEmpty } from '@packages/charmeditor/utils/checkIsContentEmpty';
import type { SelectOptionType } from '@packages/lib/proposals/forms/interfaces';
import type { ThreadWithComments } from '@packages/lib/threads/interfaces';
import { highlightDomElement, setUrlWithoutRerender } from '@packages/lib/utils/browser';
import { isTruthy } from '@packages/utils/types';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import React, { memo, useLayoutEffect, useMemo, useState } from 'react';

import type { PageSidebarView } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import PageThread from 'components/common/CharmEditor/components/thread/PageThread';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCharmEditorView } from 'hooks/useCharmEditorView';
import { useInlineComment } from 'hooks/useInlineComment';
import type { CommentThreadsMap } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import { extractThreadIdsFromDoc } from 'lib/prosemirror/plugins/inlineComments/extractDeletedThreadIds';
import { findTotalInlineComments } from 'lib/prosemirror/plugins/inlineComments/findTotalInlineComments';
import { removeInlineCommentMark } from 'lib/prosemirror/plugins/inlineComments/removeInlineCommentMark';

const Center = styled('div')`
  text-align: center;
  display: flex;
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing(3)};
  padding-bottom: ${({ theme }) => theme.spacing(3)};
  flex-direction: column;
`;

export const StyledSidebar = styled(List)`
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: 0px;
  padding-bottom: 0px;
`;

const EmptyThreadContainerBox = styled(Box)`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.palette.background.light};
`;

function getThreadList({
  threadFilter,
  threads,
  userId
}: {
  threads?: CommentThreadsMap;
  threadFilter: 'resolved' | 'open' | 'all' | 'you';
  userId?: string | null;
}) {
  const allThreads = threads ? Object.values(threads).filter(isTruthy) : [];
  const unResolvedThreads = allThreads.filter((thread) => thread && !thread.resolved);
  const resolvedThreads = allThreads.filter((thread) => thread && thread.resolved);
  let threadList: ThreadWithComments[] = [];
  if (threadFilter === 'resolved') {
    threadList = resolvedThreads;
  } else if (threadFilter === 'open') {
    threadList = unResolvedThreads;
  } else if (threadFilter === 'all') {
    threadList = allThreads as ThreadWithComments[];
  } else if (threadFilter === 'you') {
    // Filter the threads where there is at-least a single comment by the current user
    threadList = unResolvedThreads.filter((unResolvedThread) =>
      unResolvedThread.comments.some((comment) => comment.userId === userId)
    );
  }

  return {
    threadList,
    allThreads
  };
}

function useHighlightThreadBox({
  threads,
  openSidebar,
  setThreadFilter
}: {
  openSidebar: (view: PageSidebarView) => void;
  threads: ThreadWithComments[];
  setThreadFilter: (filter: 'resolved' | 'open' | 'all' | 'you') => void;
}) {
  const router = useRouter();
  const resolvedThreads = threads.filter((thread) => thread && thread.resolved);
  const lastHighlightedCommentId = React.useRef<string | null>(null);

  useLayoutEffect(() => {
    // Highlight the comment id when navigation from nexus mentioned tasks list tab

    const highlightedCommentId = router.query.inlineCommentId;

    if (typeof highlightedCommentId === 'string' && highlightedCommentId !== lastHighlightedCommentId.current) {
      openSidebar('comments');
      const isHighlightedResolved = resolvedThreads.some((thread) =>
        thread.comments.some((comment) => comment.id === highlightedCommentId)
      );
      if (isHighlightedResolved) {
        setThreadFilter('resolved');
      }

      // Remove query parameters from url
      setUrlWithoutRerender(router.pathname, { inlineCommentId: null });

      requestAnimationFrame(() => {
        const highlightedCommentElement = document.getElementById(`comment.${highlightedCommentId}`);
        if (!highlightedCommentElement) {
          return;
        }

        highlightedCommentElement.scrollIntoView({
          behavior: 'smooth'
        });

        setTimeout(() => {
          requestAnimationFrame(() => {
            highlightDomElement(highlightedCommentElement as HTMLElement);
            lastHighlightedCommentId.current = highlightedCommentId;
          });
        }, 250);
      });
    }
  }, [router.query.inlineCommentId]);
}
function CommentsSidebar({
  handleThreadFilterChange,
  threadFilter,
  threadList,
  onDeleteComment,
  onToggleResolve,
  scrollToThreadElement,
  enableComments,
  isLoading
}: {
  threadList: ThreadWithComments[];
  threadFilter: 'resolved' | 'open' | 'all' | 'you';
  handleThreadFilterChange: SelectProps['onChange'];
  enableComments: boolean;
  onToggleResolve?: (threadId: string, remove: boolean) => void;
  onDeleteComment?: (threadId: string) => void;
  scrollToThreadElement?: (threadId: string) => void;
  isLoading: boolean;
}) {
  return (
    <>
      <Box display='flex' alignItems='center' gap={1} px={1}>
        <InputLabel>Filter</InputLabel>
        <Select variant='outlined' value={threadFilter} onChange={handleThreadFilterChange}>
          <MenuItem value='open'>Open</MenuItem>
          <MenuItem value='resolved'>Resolved</MenuItem>
          <MenuItem value='you'>For you</MenuItem>
          <MenuItem value='all'>All</MenuItem>
        </Select>
      </Box>
      <StyledSidebar data-test='inline-comment-sidebar' sx={{ height: '100%', px: 1 }}>
        {isLoading ? (
          <LoadingComponent />
        ) : threadList.length === 0 ? (
          <NoCommentsMessage
            icon={
              <MessageOutlinedIcon
                fontSize='large'
                color='secondary'
                sx={{
                  height: '2em',
                  width: '2em'
                }}
              />
            }
            message={`No ${threadFilter} comments yet`}
          />
        ) : (
          threadList.map(
            (resolvedThread) =>
              resolvedThread && (
                <PageThread
                  enableComments={enableComments}
                  showFindButton
                  key={resolvedThread.id}
                  threadId={resolvedThread.id}
                  onDeleteComment={() => onDeleteComment?.(resolvedThread.id)}
                  onToggleResolve={(_, remove) => onToggleResolve?.(resolvedThread.id, remove)}
                  scrollToThreadElement={scrollToThreadElement}
                />
              )
          )
        )}
      </StyledSidebar>
    </>
  );
}

function EditorCommentsSidebarComponent({
  enableComments,
  threads,
  openSidebar
}: {
  threads?: CommentThreadsMap;
  enableComments: boolean;
  openSidebar: (view: PageSidebarView) => void;
}) {
  const { user } = useUser();
  const [threadFilter, setThreadFilter] = useState<'resolved' | 'open' | 'all' | 'you'>('open');

  const { threadList, allThreads } = useMemo(() => {
    return getThreadList({
      threadFilter,
      threads,
      userId: user?.id
    });
  }, [threads, threadFilter, user?.id]);
  const handleThreadClassChange: SelectProps['onChange'] = (event) => {
    setThreadFilter(event.target.value as any);
  };

  useHighlightThreadBox({
    openSidebar,
    setThreadFilter,
    threads: threads ? Object.values(threads).filter(isTruthy) : []
  });
  const { view } = useCharmEditorView();
  const { updateThreadPluginState } = useInlineComment(view);
  // view.state.doc stays the same (empty content) even when the document content changes
  const extractedThreadIds =
    !view || !threads
      ? new Set()
      : checkIsContentEmpty(view?.state.doc.toJSON())
        ? new Set(Object.keys(threads))
        : extractThreadIdsFromDoc(view.state.doc, specRegistry.schema);

  // Making sure the position sort doesn't filter out comments that are not in the view
  const inlineThreadsIds =
    view && threads
      ? Array.from(
          new Set([
            ...findTotalInlineComments(view.state.schema, view.state.doc, threads, true).threadIds,
            ...allThreads.map((thread) => thread?.id)
          ])
        ).filter((id) => extractedThreadIds.has(id))
      : [];

  const threadListSet = new Set(threadList.map((thread) => thread.id));
  const sortedThreadList = inlineThreadsIds
    .filter((inlineThreadsId) => threadListSet.has(inlineThreadsId))
    .map((filteredThreadId) => threads && threads[filteredThreadId])
    .filter(isTruthy)
    // sort these since we convert it to a map afer the server responds
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <CommentsSidebar
      enableComments={enableComments}
      handleThreadFilterChange={handleThreadClassChange}
      isLoading={!view || !threads}
      threadFilter={threadFilter}
      threadList={sortedThreadList}
      onDeleteComment={(threadId) => {
        if (view) {
          removeInlineCommentMark(view, threadId, true);
          updateThreadPluginState({
            remove: true,
            threadId
          });
        }
      }}
      onToggleResolve={(threadId, remove) => {
        if (view) {
          removeInlineCommentMark(view, threadId);
          updateThreadPluginState({
            remove,
            threadId
          });
        }
      }}
    />
  );
}

function FormCommentsSidebarComponent({
  enableComments,
  threads,
  openSidebar,
  formFields
}: {
  formFields:
    | (Omit<FormField, 'options'> & {
        options: SelectOptionType[];
      })[]
    | null;
  threads?: CommentThreadsMap;
  enableComments: boolean;
  openSidebar: (view: PageSidebarView) => void;
}) {
  const { user } = useUser();
  const [threadFilter, setThreadFilter] = useState<'resolved' | 'open' | 'all' | 'you'>('open');

  const threadList = useMemo(() => {
    const { threadList: _threadList } = getThreadList({
      threadFilter,
      threads,
      userId: user?.id
    });

    if (!formFields || formFields.length === 0) {
      return _threadList;
    }

    _threadList.sort((a, b) => {
      const aFormFieldIndex = formFields.findIndex((formField) => formField.id === a.fieldAnswer?.fieldId);
      const bFormFieldIndex = formFields.findIndex((formField) => formField.id === b.fieldAnswer?.fieldId);
      if (aFormFieldIndex === -1 || bFormFieldIndex === -1) {
        return 0;
      }

      if (aFormFieldIndex === bFormFieldIndex) {
        return a.createdAt > b.createdAt ? 1 : -1;
      }

      return aFormFieldIndex - bFormFieldIndex;
    });

    return _threadList;
  }, [threads, formFields, threadFilter, user?.id]);

  const handleThreadFilterChange: SelectProps['onChange'] = (event) => {
    setThreadFilter(event.target.value as any);
  };

  useHighlightThreadBox({
    openSidebar,
    setThreadFilter,
    threads: threads ? Object.values(threads).filter(isTruthy) : []
  });

  return (
    <CommentsSidebar
      handleThreadFilterChange={handleThreadFilterChange}
      enableComments={enableComments}
      threadFilter={threadFilter}
      isLoading={!threads}
      threadList={threadList}
      scrollToThreadElement={(threadId) => {
        const fieldAnswerElements = document.querySelectorAll('.proposal-form-field-answer');
        for (const fieldAnswerElement of fieldAnswerElements) {
          const threadIds = fieldAnswerElement.getAttribute('data-thread-ids');
          if (threadIds?.includes(threadId)) {
            requestAnimationFrame(() => {
              fieldAnswerElement.scrollIntoView({
                behavior: 'smooth'
              });

              setTimeout(() => {
                requestAnimationFrame(() => {
                  highlightDomElement(fieldAnswerElement as HTMLElement);
                });
              }, 250);
            });
            break;
          }
        }
      }}
    />
  );
}

export function NoCommentsMessage({
  icon,
  message,
  children
}: {
  icon: ReactNode;
  message: string;
  children?: ReactNode;
}) {
  return (
    <EmptyThreadContainerBox data-test='empty-message'>
      <Center id='center'>
        {icon}
        <Typography variant='subtitle1' color='secondary'>
          {message}
        </Typography>
        {children}
      </Center>
    </EmptyThreadContainerBox>
  );
}

export const EditorCommentsSidebar = memo(EditorCommentsSidebarComponent);
export const FormCommentsSidebar = memo(FormCommentsSidebarComponent);
