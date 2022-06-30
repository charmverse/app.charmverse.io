import { Box, BoxProps, List, MenuItem, Select, SelectProps, Typography } from '@mui/material';
import PageThread from 'components/common/CharmEditor/components/PageThread';
import { useThreads } from 'hooks/useThreads';
import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';
import { useUser } from 'hooks/useUser';
import { useEditorViewContext } from '@bangle.dev/react';
import { findTotalInlineComments } from 'lib/inline-comments/findTotalInlineComments';
import { silentlyUpdateURL } from 'lib/browser';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';

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

const StyledPageThreadsBox = styled(Box)`
  max-width: 400px;
  height: 100%;
  width: 100%;
`;

const StyledPageThreadsList = styled(List)`
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

function getCommentFromThreads (threads: (ThreadWithCommentsAndAuthors | undefined)[], commentId: string) {
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

export default function PageThreadsList ({ sx, inline, ...props }: BoxProps & {inline?: boolean}) {
  const { threads } = useThreads();
  const [user] = useUser();
  const allThreads = Object.values(threads);
  const unResolvedThreads = allThreads.filter(thread => thread && !thread.resolved) as ThreadWithCommentsAndAuthors[];
  const resolvedThreads = allThreads.filter(thread => thread && thread.resolved) as ThreadWithCommentsAndAuthors[];
  const [threadFilter, setThreadFilter] = useState<'resolved' | 'open' | 'all' | 'you'>('open');
  const [threadSort, setThreadSort] = useState<'earliest' | 'latest' | 'position'>('position');
  const handleThreadClassChange: SelectProps['onChange'] = (event) => {
    setThreadFilter(event.target.value as any);
  };
  const handleThreadListSortChange: SelectProps['onChange'] = (event) => {
    setThreadSort(event.target.value as any);
  };

  let threadList: ThreadWithCommentsAndAuthors[] = [];
  if (threadFilter === 'resolved') {
    threadList = resolvedThreads;
  }
  else if (threadFilter === 'open') {
    threadList = unResolvedThreads;
  }
  else if (threadFilter === 'all') {
    threadList = allThreads as ThreadWithCommentsAndAuthors[];
  }
  else if (threadFilter === 'you') {
    // Filter the threads where there is at-least a single comment by the current user
    threadList = unResolvedThreads.filter(unResolvedThread => unResolvedThread.comments.some(comment => comment.userId === user?.id));
  }

  const view = useEditorViewContext();
  const inlineThreadsIds = threadSort === 'position' ? findTotalInlineComments(view, view.state.doc, threads, true).threadIds : [];

  let sortedThreadList: ThreadWithCommentsAndAuthors[] = [];
  if (threadSort === 'earliest') {
    sortedThreadList = threadList.sort(
      (threadA, threadB) => threadA && threadB ? new Date(threadA.createdAt).getTime() - new Date(threadB.createdAt).getTime() : 0
    );
  }
  else if (threadSort === 'latest') {
    sortedThreadList = threadList.sort(
      (threadA, threadB) => threadA && threadB ? new Date(threadB.createdAt).getTime() - new Date(threadA.createdAt).getTime() : 0
    );
  }
  else {
    const threadListSet = new Set(threadList.map(thread => thread.id));
    const filteredThreadIds = inlineThreadsIds.filter(inlineThreadsId => threadListSet.has(inlineThreadsId));
    sortedThreadList = filteredThreadIds.map(filteredThreadId => threads[filteredThreadId] as ThreadWithCommentsAndAuthors);
  }

  useEffect(() => {
    // Highlight the comment id when navigation from nexus mentioned tasks list tab
    const highlightedCommentId = (new URLSearchParams(window.location.search)).get('commentId');
    if (highlightedCommentId) {
      const highlightedComment = getCommentFromThreads(allThreads, highlightedCommentId);
      if (highlightedComment) {
        const highlightedCommentDomNode = document.getElementById(`comment.${highlightedComment.id}`);
        if (highlightedCommentDomNode) {
          setTimeout(() => {
            setThreadFilter('all');
            // Remove query parameters from url
            silentlyUpdateURL(window.location.href.split('?')[0]);
            requestAnimationFrame(() => {
              highlightedCommentDomNode.scrollIntoView({
                behavior: 'smooth'
              });
            });
          }, 250);
        }
      }
    }
  }, [allThreads, window.location.search]);

  return (
    <StyledPageThreadsBox
      // The className is used to access it using regular dom api
      className='PageThreadsList'
      {...props}
      sx={{
        ...(sx ?? {})
      }}
    >
      <Box display='flex' alignItems='center' justifyContent='space-between' mb={1}>
        <Typography fontWeight={600} fontSize={20}>Comments</Typography>
        <Box display='flex' gap={1}>
          <Select variant='outlined' value={threadFilter} onChange={handleThreadClassChange}>
            <MenuItem value='open'>Open</MenuItem>
            <MenuItem value='resolved'>Resolved</MenuItem>
            <MenuItem value='you'>For you</MenuItem>
            <MenuItem value='all'>All</MenuItem>
          </Select>
          <Select variant='outlined' value={threadSort} onChange={handleThreadListSortChange}>
            <MenuItem value='position'>Position</MenuItem>
            <MenuItem value='latest'>Latest</MenuItem>
            <MenuItem value='earliest'>Earliest</MenuItem>
          </Select>
        </Box>
      </Box>
      <StyledPageThreadsList>
        {sortedThreadList.length === 0 ? (
          <EmptyThreadContainerBox>
            <Center>
              <CommentOutlinedIcon
                fontSize='large'
                color='secondary'
                sx={{
                  height: '2em',
                  width: '2em'
                }}
              />
              <Typography variant='subtitle1' color='secondary'>No {threadFilter} threads yet</Typography>
            </Center>
          </EmptyThreadContainerBox>
        ) : sortedThreadList.map(resolvedThread => resolvedThread
          && <PageThread showFindButton inline={inline} key={resolvedThread.id} threadId={resolvedThread?.id} />)}
      </StyledPageThreadsList>
    </StyledPageThreadsBox>
  );
}
