import { Box, BoxProps, List, MenuItem, Paper, Select, SelectProps, Typography } from '@mui/material';
import PageThread from 'components/common/CharmEditor/components/Threads/PageThread';
import { useThreads } from 'hooks/useThreads';
import { useState } from 'react';
import CommentSvg from 'public/svgs/comments.svg';
import styled from '@emotion/styled';

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

export default function PageThreadsList ({ sx, inline, ...props }: BoxProps & {inline?: boolean}) {
  const { threads } = useThreads();
  const allThreads = Object.values(threads);
  const unResolvedThreads = allThreads.filter(thread => thread && !thread.resolved);
  const resolvedThreads = allThreads.filter(thread => thread && thread.resolved);
  const [threadClass, setThreadClass] = useState<'resolved' | 'open'>('open');
  const handleChange: SelectProps['onChange'] = (event) => {
    setThreadClass(event.target.value as any);
  };

  const threadsList = threadClass === 'resolved' ? resolvedThreads : unResolvedThreads;

  return (
    <Box
      // The className is used to refer to it using regular dom api
      className='PageThreadsList'
      {...props}
      sx={{
        ...(sx ?? {}),
        maxWidth: 550,
        height: 'calc(100% - 25px)',
        width: '100%'
      }}
    >
      <Box display='flex' alignItems='center' justifyContent='space-between' my={1}>
        <Typography variant='h6'>Threads</Typography>
        <Select variant='outlined' value={threadClass} onChange={handleChange}>
          <MenuItem value='resolved'>Resolved</MenuItem>
          <MenuItem value='open'>Open</MenuItem>
        </Select>
      </Box>
      <List sx={{
        height: 'calc(100% - 30px)',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}
      >
        {threadsList.length === 0 ? (
          <Center>
            <CommentSvg />
            <Typography variant='subtitle1' color='secondary'>No {threadClass} threads yet </Typography>
          </Center>
        ) : threadsList.map(resolvedThread => resolvedThread && <PageThread inline={inline} key={resolvedThread.id} threadId={resolvedThread?.id} />)}
      </List>
    </Box>
  );
}
