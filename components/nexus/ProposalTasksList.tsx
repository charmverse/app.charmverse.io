import { Alert, Button, Card, Grid, Link, Typography } from '@mui/material';
import { Box } from '@mui/system';
import LoadingComponent from 'components/common/LoadingComponent';
import { GetTasksResponse } from 'pages/api/tasks/list';
import ForumIcon from '@mui/icons-material/Forum';
import { KeyedMutator } from 'swr';
import { ExtendedProposal } from 'lib/proposal/interface';
import { useUser } from 'hooks/useUser';
import { useContributors } from 'hooks/useContributors';
import useRoles from 'hooks/useRoles';

/**
 * Page only needs to be provided for proposal type proposals
 */
export function ProposalTasksListRow (
  props: {proposalTask: ExtendedProposal}
) {
  const {
    proposalTask
  } = props;
  const { user } = useUser();
  const { roleups } = useRoles();

  const {
    page: { path: pagePath, title: pageTitle },
    space: { domain: spaceDomain, name: spaceName },
    id
  } = proposalTask;

  const proposalLink = `/${spaceDomain}/${pagePath}?proposalId=${id}`;
  const proposalLocation = `${pageTitle || 'Untitled'} in ${spaceName}`;

  const isProposalAuthor = (user && proposalTask.authors.some(author => author.userId === user.id));
  const isProposalReviewer = (user && (proposalTask.reviewers.some(reviewer => {
    if (reviewer.userId) {
      return reviewer.userId === user.id;
    }
    return roleups.some(role => role.id === reviewer.roleId && role.users.some(_user => _user.id === user.id));
  })));

  let buttonLabel = '';

  if (isProposalAuthor) {
    if (proposalTask.status.match('draft')) {
      buttonLabel = 'Discussion';
    }
    else if (proposalTask.status === 'reviewed') {
      buttonLabel = 'Start vote';
    }
  }
  else if (isProposalReviewer) {
    if (proposalTask.status === 'review') {
      buttonLabel = 'Review';
    }
  }
  else if (proposalTask.status === 'discussion') {
    buttonLabel = 'Discuss';
  }

  if (proposalTask.status === 'vote_active') {
    buttonLabel = 'Vote';
  }

  return (
    <Box>
      <Card sx={{ width: '100%', px: 2, py: 1, my: 2, borderLeft: 0, borderRight: 0 }} variant='outlined'>
        <Grid justifyContent='space-between' alignItems='center' gap={1} container>
          <Grid
            item
            xs={12}
            sm={12}
            md={4}
            sx={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              mr: 1,
              alignItems: 'center',
              display: 'flex',
              gap: 0.5
            }}
            fontSize={{ sm: 16, xs: 18 }}
          >
            {pageTitle || 'Untitled'}
          </Grid>
          <Grid
            item
            xs={12}
            sm={12}
            md={4}
            sx={{
              fontSize: { xs: 14, sm: 'inherit' }
            }}
          >
            <Link href={proposalLink}>
              {proposalLocation}
            </Link>
          </Grid>
          <Grid
            item
            xs={12}
            sm={2}
            md={1}
          >
            <Button onClick={() => {
            }}
            >{buttonLabel}
            </Button>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}

export default function ProposalTasksList ({
  tasks,
  error,
  mutateTasks
} : {
  error: any
  mutateTasks: KeyedMutator<GetTasksResponse>
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
  else if (!tasks?.proposals) {
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

  return (
    <>
      {tasks.proposals.map(proposal => <ProposalTasksListRow key={proposal.id} proposalTask={proposal} />)}
    </>
  );
}
