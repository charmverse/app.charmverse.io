import { Box, BoxProps, List, MenuItem, Select, SelectProps, Typography } from '@mui/material';
import PageThread from 'components/common/CharmEditor/components/Threads/PageThread';
import { useThreads } from 'hooks/useThreads';
import { useState } from 'react';

export default function PageThreadsList ({ sx, inline, ...props }: BoxProps & {inline?: boolean}) {
  const { threads } = useThreads();
  const allThreads = Object.values(threads);
  const unResolvedThreads = allThreads.filter(thread => thread && !thread.resolved);
  const resolvedThreads = allThreads.filter(thread => thread && thread.resolved);
  const [threadClass, setThreadClass] = useState<'resolved' | 'unresolved'>('unresolved');
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
        width: '100%'
      }}
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
        gap: 1
      }}
      >
        {threadsList.map(resolvedThread => resolvedThread && <PageThread inline={inline} key={resolvedThread.id} threadId={resolvedThread?.id} />)}
      </List>
    </Box>
  );
}
