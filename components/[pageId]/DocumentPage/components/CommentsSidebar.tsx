import { useEditorViewContext } from '@bangle.dev/react';
import { isEmptyDocument } from '@bangle.dev/utils';
import type { PagePermissionFlags } from '@charmverse/core/permissions';
import styled from '@emotion/styled';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import type { SelectProps } from '@mui/material';
import { Box, InputLabel, List, MenuItem, Select, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import React, { memo, useLayoutEffect, useMemo, useState } from 'react';

import PageThread from 'components/common/CharmEditor/components/PageThread';
import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import { usePageSidebar } from 'hooks/usePageSidebar';
import { useThreads } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import { extractThreadIdsFromDoc } from 'lib/prosemirror/plugins/inlineComments/extractDeletedThreadIds';
import { findTotalInlineComments } from 'lib/prosemirror/plugins/inlineComments/findTotalInlineComments';
import type { ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';
import { highlightDomElement, setUrlWithoutRerender } from 'lib/utilities/browser';
import { isTruthy } from 'lib/utilities/types';

const Center = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  align-items: center;
  flex-direction: column;
`;

export const StyledSidebar = styled(List)`
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: 0px;
  padding-bottom: 0px;
  height: calc(100% - 50px);
`;

const EmptyThreadContainerBox = styled(Box)`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.palette.background.light};
`;

function CommentsSidebarComponent({ inline, permissions }: { inline?: boolean; permissions?: PagePermissionFlags }) {
  const router = useRouter();
  const { threads } = useThreads();
  const { user } = useUser();

  const allThreads = useMemo(() => Object.values(threads).filter(isTruthy), [threads]);
  const unResolvedThreads = allThreads.filter((thread) => thread && !thread.resolved);
  const resolvedThreads = allThreads.filter((thread) => thread && thread.resolved);
  const [threadFilter, setThreadFilter] = useState<'resolved' | 'open' | 'all' | 'you'>('open');
  const handleThreadClassChange: SelectProps['onChange'] = (event) => {
    setThreadFilter(event.target.value as any);
  };
  const lastHighlightedCommentId = React.useRef<string | null>(null);

  const { setActiveView } = usePageSidebar();

  let threadList: ThreadWithCommentsAndAuthors[] = [];
  if (threadFilter === 'resolved') {
    threadList = resolvedThreads;
  } else if (threadFilter === 'open') {
    threadList = unResolvedThreads;
  } else if (threadFilter === 'all') {
    threadList = allThreads as ThreadWithCommentsAndAuthors[];
  } else if (threadFilter === 'you') {
    // Filter the threads where there is at-least a single comment by the current user
    threadList = unResolvedThreads.filter((unResolvedThread) =>
      unResolvedThread.comments.some((comment) => comment.userId === user?.id)
    );
  }

  const view = useEditorViewContext();
  // view.state.doc stays the same (empty content) even when the document content changes
  const extractedThreadIds = isEmptyDocument(view.state.doc)
    ? new Set(Object.keys(threads))
    : extractThreadIdsFromDoc(view.state.doc, specRegistry.schema);

  // Making sure the position sort doesn't filter out comments that are not in the view
  const inlineThreadsIds = Array.from(
    new Set([
      ...findTotalInlineComments(view.state.schema, view.state.doc, threads, true).threadIds,
      ...allThreads.map((thread) => thread?.id)
    ])
  ).filter((id) => extractedThreadIds.has(id));

  const threadListSet = new Set(threadList.map((thread) => thread.id));
  const sortedThreadList = inlineThreadsIds
    .filter((inlineThreadsId) => threadListSet.has(inlineThreadsId))
    .map((filteredThreadId) => threads[filteredThreadId])
    .filter(isTruthy);

  useLayoutEffect(() => {
    // Highlight the comment id when navigation from nexus mentioned tasks list tab

    const highlightedCommentId = router.query.inlineCommentId;

    if (typeof highlightedCommentId === 'string' && highlightedCommentId !== lastHighlightedCommentId.current) {
      setActiveView('comments');
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

  return (
    <>
      <Box display='flex' alignItems='center' gap={1}>
        <InputLabel>Filter</InputLabel>
        <Select variant='outlined' value={threadFilter} onChange={handleThreadClassChange}>
          <MenuItem value='open'>Open</MenuItem>
          <MenuItem value='resolved'>Resolved</MenuItem>
          <MenuItem value='you'>For you</MenuItem>
          <MenuItem value='all'>All</MenuItem>
        </Select>
      </Box>
      <StyledSidebar className='charm-inline-comment-sidebar'>
        {sortedThreadList.length === 0 ? (
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
          sortedThreadList.map(
            (resolvedThread) =>
              resolvedThread && (
                <PageThread
                  permissions={permissions}
                  showFindButton
                  inline={inline}
                  key={resolvedThread.id}
                  threadId={resolvedThread?.id}
                />
              )
          )
        )}
      </StyledSidebar>
    </>
  );
}

export function NoCommentsMessage({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <EmptyThreadContainerBox>
      <Center>
        {icon}
        <Typography variant='subtitle1' color='secondary'>
          {message}
        </Typography>
      </Center>
    </EmptyThreadContainerBox>
  );
}

export const CommentsSidebar = memo(CommentsSidebarComponent);
