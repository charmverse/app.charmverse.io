import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import type { BoxProps, SelectProps } from '@mui/material';
import { Box, InputLabel, List, MenuItem, Select, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import PageThread from 'components/common/CharmEditor/components/PageThread';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { useThreads } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
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

function getCommentFromThreads(threads: (ThreadWithCommentsAndAuthors | undefined)[], commentId: string) {
  if (!threads) {
    return null;
  }

  for (let threadIdx = 0; threadIdx < threads.length; threadIdx += 1) {
    const thread = threads[threadIdx];
    if (thread) {
      for (let commentIdx = 0; commentIdx < thread.comments.length; commentIdx += 1) {
        if (thread.comments[commentIdx].id === commentId) {
          return thread.comments[commentIdx];
        }
      }
    }
  }
  return null;
}

export function CommentsSidebar({ inline }: BoxProps & { inline?: boolean }) {
  const router = useRouter();
  const { threads } = useThreads();
  const { user } = useUser();

  const allThreads = Object.values(threads).filter(isTruthy);
  const unResolvedThreads = allThreads.filter((thread) => thread && !thread.resolved);
  const resolvedThreads = allThreads.filter((thread) => thread && thread.resolved);
  const [threadFilter, setThreadFilter] = useState<'resolved' | 'open' | 'all' | 'you'>('open');
  const handleThreadClassChange: SelectProps['onChange'] = (event) => {
    setThreadFilter(event.target.value as any);
  };

  const { setCurrentPageActionDisplay } = usePageActionDisplay();

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
  // Making sure the position sort doesn't filter out comments that are not in the view
  const inlineThreadsIds = Array.from(
    new Set([
      ...findTotalInlineComments(view.state.schema, view.state.doc, threads, true).threadIds,
      ...allThreads.map((thread) => thread?.id)
    ])
  );

  const threadListSet = new Set(threadList.map((thread) => thread.id));
  const sortedThreadList = inlineThreadsIds
    .filter((inlineThreadsId) => threadListSet.has(inlineThreadsId))
    .map((filteredThreadId) => threads[filteredThreadId])
    .filter(isTruthy);

  useEffect(() => {
    // Highlight the comment id when navigation from nexus mentioned tasks list tab
    const highlightedCommentId = router.query.commentId;
    if (typeof highlightedCommentId === 'string') {
      const highlightedComment = getCommentFromThreads(allThreads, highlightedCommentId);
      if (highlightedComment) {
        const highlightedCommentDomNode = document.getElementById(`comment.${highlightedComment.id}`);
        if (highlightedCommentDomNode) {
          setTimeout(() => {
            setCurrentPageActionDisplay('comments');
            setThreadFilter('all');
            // Remove query parameters from url
            setUrlWithoutRerender(router.pathname, { commentId: null });
            requestAnimationFrame(() => {
              highlightedCommentDomNode.scrollIntoView({
                behavior: 'smooth'
              });
              setTimeout(() => {
                requestAnimationFrame(() => {
                  highlightDomElement(highlightedCommentDomNode);
                });
              }, 250);
            });
          }, 250);
        }
      }
    }
  }, [allThreads, router.query.commentId]);

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
                <PageThread showFindButton inline={inline} key={resolvedThread.id} threadId={resolvedThread?.id} />
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
