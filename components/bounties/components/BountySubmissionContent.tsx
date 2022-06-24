import Box from '@mui/material/Box';
import { Application } from '@prisma/client';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { useContributors } from 'hooks/useContributors';
import Typography from '@mui/material/Typography';

interface Props {
  submission: Application;
}

export default function BountySubmissionContent ({ submission }: Props) {

  const [contributors] = useContributors();

  const submitter = contributors.find(c => c.id === submission.createdBy);

  return (
    <Box flexGrow={1}>
      <Typography variant='h6'>
        {submitter?.username}'s submission
      </Typography>
      <InlineCharmEditor
        content={submission?.submissionNodes ? JSON.parse(submission?.submissionNodes) : ''}
        readOnly
      />
    </Box>
  );
}
