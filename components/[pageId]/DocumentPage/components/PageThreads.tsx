import { Box, List } from '@mui/material';
import { useThreads } from 'hooks/useThreads';

export default function PageThreads () {
  const { threads } = useThreads();
  const threadsList = Object.values(threads);
  const unResolvedThreads = threadsList.filter(thread => thread && !thread.resolved);
  const resolvedThreads = threadsList.filter(thread => thread && thread.resolved);

  return (
    <List>
      {unResolvedThreads.map(unresolvedThread => (
        <Box>
        </Box>
      ))}
    </List>
  );
}
