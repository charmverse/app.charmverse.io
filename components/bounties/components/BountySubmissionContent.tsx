import Box from '@mui/material/Box';
import { Application, Bounty } from '@prisma/client';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { getDisplayName } from 'lib/users';
import { useContributors } from 'hooks/useContributors';
import Typography from '@mui/material/Typography';
import { Contributor, LoggedInUser } from 'models';
import ApplicationThread from './ApplicationThread';

interface BountySubmissionContentProps {
  submission: Application;
  user: LoggedInUser | null;
  reviewerUser: Contributor;
}

export default function BountySubmissionContent (props: BountySubmissionContentProps) {
  const { submission, user, reviewerUser } = props;
  const [contributors] = useContributors();

  const submitter = contributors.find(c => c.id === submission.createdBy);

  const canComment: boolean = user?.id === submitter?.id || user?.id === reviewerUser.id;

  return (
    <Box flexGrow={1}>
      <Typography variant='h6'>
        {getDisplayName(submitter)}'s submission
      </Typography>
      <InlineCharmEditor
        content={submission?.submissionNodes ? JSON.parse(submission?.submissionNodes) : ''}
        readOnly
      />
      <ApplicationThread
        applicationId={submission.id}
        spaceId={submission.spaceId}
        canComment={canComment}
        submissionId={submission.id}
      />
    </Box>
  );
}
