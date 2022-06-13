import { Alert, Box } from '@mui/material';
import LoadingComponent from 'components/common/LoadingComponent';
import { MentionedTask } from 'lib/mentions/interfaces';
import useTasks from './hooks/useTasks';

function MentionedTask ({ mentionIds, pageId }: {pageId: string, mentionIds: string[]}) {
  return (
    <Box>
      {mentionIds} mentions on page {pageId}
    </Box>
  );
}

export default function MentionedTasksList () {
  const { tasks, error } = useTasks();

  if (tasks?.mentioned.length === 0) {
    if (error) {
      return (
        <Box>
          <Alert severity='error'>
            There was an error. Please try again later!
          </Alert>
        </Box>
      );
    }
    else {
      return <LoadingComponent height='200px' isLoading={true} />;
    }
  }

  const pageIdMentionsRecord: Record<string, string[]> = {};
  tasks?.mentioned.forEach(({ mentionId, pageId }) => {
    if (!pageIdMentionsRecord[pageId]) {
      pageIdMentionsRecord[pageId] = [mentionId];
    }
    else {
      pageIdMentionsRecord[pageId].push(mentionId);
    }
  });

  return (
    Object.entries(pageIdMentionsRecord).map(([pageId, mentionIds]) => <MentionedTask mentionIds={mentionIds} key={pageId} pageId={pageId} />)
  );
}
