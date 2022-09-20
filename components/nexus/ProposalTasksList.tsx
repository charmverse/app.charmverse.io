import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Alert, Card, Grid, Typography } from '@mui/material';
import { Box } from '@mui/system';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import { ProposalStatusChip } from 'components/proposals/components/ProposalStatusBadge';
import type { ProposalTask } from 'lib/proposal/getProposalTasks';
import { GetTasksResponse } from 'pages/api/tasks/list';
import { useEffect } from 'react';
import { KeyedMutator } from 'swr';

const ProposalActionRecord: Record<ProposalTask['action'], string> = {
  discuss: 'Discuss',
  start_discussion: 'To discuss',
  review: 'Review',
  start_vote: 'Start vote',
  vote: 'Vote',
  start_review: 'To review'
};

/**
 * Page only needs to be provided for proposal type proposals
 */
export function ProposalTasksListRow (
  {
    proposalTask: {
      spaceDomain,
      pagePath,
      spaceName,
      pageTitle,
      action,
      status
    }
  }: {proposalTask: ProposalTask}
) {
  const proposalLink = `/${spaceDomain}/${pagePath}`;
  const proposalLocation = spaceName;
  return (
    <Box>
      <Card sx={{ width: '100%', px: 2, py: 1, my: 2, borderLeft: 0, borderRight: 0 }} variant='outlined'>
        <Grid justifyContent='space-between' alignItems='center' gap={1} container>
          <Grid
            item
            xs={12}
            sm={12}
            md={3}
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
            <Link
              href={proposalLink}
              sx={{
                '&.MuiLink-root': {
                  color: 'inherit'
                }
              }}
            >
              {proposalLocation}
            </Link>
          </Grid>
          <Grid item md={2} display='flex' justifyContent='center'>
            <ProposalStatusChip status={status} />
          </Grid>
          <Grid
            item
            xs={12}
            sm={3}
            md={2}
            justifyContent={{
              md: 'flex-end'
            }}
            display='flex'
          >
            <Button
              sx={{
                minWidth: 100,
                width: {
                  xs: '100%',
                  md: 100
                },
                textAlign: 'center'
              }}
              href={proposalLink}
            >{ProposalActionRecord[action]}
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
  mutateTasks: KeyedMutator<GetTasksResponse>
  error: any
  tasks: GetTasksResponse | undefined
}) {
  const proposals = tasks?.proposals ? [...tasks.proposals.marked, ...tasks.proposals.unmarked] : [];

  useEffect(() => {
    async function main () {
      if (proposals.length !== 0) {
        await charmClient.markTasks(proposals.map(proposal => ({ id: `${proposal.id}.${proposal.status}`, type: 'proposal' })));
        mutateTasks();
      }
    }
    main();
  }, [tasks]);

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

  const totalProposals = proposals.length;

  if (totalProposals === 0) {
    return (
      <Card variant='outlined'>
        <Box p={3} textAlign='center'>
          <TaskOutlinedIcon />
          <Typography color='secondary'>You don't have any proposals right now</Typography>
        </Box>
      </Card>
    );
  }

  return (
    <>
      {proposals.map(proposal => <ProposalTasksListRow key={proposal.id} proposalTask={proposal} />)}
    </>
  );
}
