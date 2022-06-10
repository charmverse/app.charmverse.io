import Box from '@mui/material/Box';
import { Application, Bounty } from '@prisma/client';
import useSWRImmutable from 'swr/immutable';
import charmClient from 'charmClient';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { getDisplayName } from 'lib/users';
import { useContributors } from 'hooks/useContributors';
import Typography from '@mui/material/Typography';
import ApplicationThread from './ApplicationThread';

interface Props {
  bounty: Bounty
  submission: Application
}

export default function BountySubmissionContent ({ bounty, submission }: Props) {

  const [contributors] = useContributors();

  const submitter = contributors.find(c => c.id === submission.createdBy);

  const { data: thread } = useSWRImmutable(`/applications/${submission.id}/threads`, () => charmClient.getApplicationThread(submission.id));

  return (
    <Box flexGrow={1}>
      <Typography variant='h6'>
        {getDisplayName(submitter)}'s submission
      </Typography>
      <InlineCharmEditor
        content={submission?.submissionNodes ? JSON.parse(submission?.submissionNodes) : ''}
        readOnly
      />
      <ApplicationThread applicationId={submission.id} thread={thread} />
    </Box>
  );
}
