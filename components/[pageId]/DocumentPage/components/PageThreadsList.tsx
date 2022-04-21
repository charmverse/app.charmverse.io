import { Box, List, MenuItem, Select, SelectProps, Typography } from '@mui/material';
import PageThread from 'components/common/CharmEditor/components/Threads/PageThread';
import { useThreads } from 'hooks/useThreads';
import { useState } from 'react';

export default function PageThreadsList () {
  const { threads } = useThreads();
  const threadsList = Object.values(threads);
  const unResolvedThreads = threadsList.filter(thread => thread && !thread.resolved);
  const resolvedThreads = threadsList.filter(thread => thread && thread.resolved);
  const [threadClass, setThreadClass] = useState<'resolved' | 'unresolved'>('resolved');
  const handleChange: SelectProps['onChange'] = (event) => {
    setThreadClass(event.target.value as any);
  };
  return (
    <Box
      sx={{
        maxHeight: 500,
        width: 550
      }}
      // The className is used to refer to it using regular dom api
      className='PageThreadsList'
    >
      <Box display='flex' alignItems='center' justifyContent='space-between' my={1}>
        <Typography variant='h6'>Threads</Typography>
        <Select variant='outlined' value={threadClass} onChange={handleChange}>
          <MenuItem value='resolved'>Resolved</MenuItem>
          <MenuItem value='unresolved'>Open</MenuItem>
        </Select>
      </Box>
      <List sx={{
        height: '90%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        pr: 1,
        gap: 1
      }}
      >
        {threadClass === 'resolved' ? resolvedThreads.map(resolvedThread => resolvedThread && <PageThread key={resolvedThread.id} threadId={resolvedThread?.id} />) : unResolvedThreads.map(unresolvedThread => unresolvedThread && <PageThread key={unresolvedThread.id} threadId={unresolvedThread?.id} />)}
      </List>
    </Box>
  );
}
