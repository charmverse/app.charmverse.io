import { List } from '@mui/material';
import PageThread from 'components/common/CharmEditor/components/Threads/PageThread';
import { useThreads } from 'hooks/useThreads';

export default function PageThreads () {
  const { threads } = useThreads();
  const threadsList = Object.values(threads);
  const unResolvedThreads = threadsList.filter(thread => thread && !thread.resolved);

  return (
    <List
      sx={{
        maxHeight: 500,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        p: 1,
        gap: 2
      }}
      className='PageThreadsList'
    >
      {unResolvedThreads.map(unresolvedThread => unresolvedThread && <PageThread key={unresolvedThread.id} threadId={unresolvedThread?.id} />)}
    </List>
  );
}
