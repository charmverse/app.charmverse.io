import { Alert, Card, Typography } from '@mui/material';
import { Box } from '@mui/system';
import LoadingComponent from 'components/common/LoadingComponent';
import { GetTasksResponse } from 'pages/api/tasks/list';
import ForumIcon from '@mui/icons-material/Forum';

export default function ProposalTasksList ({
  tasks,
  error
} : {
  error: any
  tasks: GetTasksResponse | undefined
}) {

  if (error) {
    return (
      <Box>
        <Alert severity='error'>
          There was an error. Please try again later!
        </Alert>
      </Box>
    );
  }
  else if (!tasks?.votes) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  const totalProposals = tasks?.proposals.length ?? 0;

  if (totalProposals === 0) {
    return (
      <Card variant='outlined'>
        <Box p={3} textAlign='center'>
          <ForumIcon />
          <Typography color='secondary'>You don't have any proposals right now</Typography>
        </Box>
      </Card>
    );
  }

  return null;
}
