import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/system';
import { useEffect } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import { ProposalStatusChip } from 'components/proposals/components/ProposalStatusBadge';
import type { ProposalTask, ProposalTaskAction } from 'lib/proposal/getProposalTasks';
import type { GetTasksResponse } from 'pages/api/tasks/list';

import Table from './components/NexusTable';

const ProposalActionRecord: Record<ProposalTaskAction, string> = {
  discuss: 'Discuss',
  start_discussion: 'To discuss',
  review: 'Review',
  start_vote: 'Start vote',
  vote: 'Vote',
  start_review: 'To review'
};

const SMALL_TABLE_CELL_WIDTH = 150;

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
  }: { proposalTask: ProposalTask }
) {
  const proposalLink = `/${spaceDomain}/${pagePath}`;
  const workspaceProposals = `/${spaceDomain}/proposals`;

  return (
    <TableRow>
      <TableCell>
        <Link
          color='inherit'
          href={proposalLink}
          sx={{
            maxWidth: {
              xs: '130px',
              sm: '200px',
              md: '400px'
            }
          }}
          display='flex'
        >
          <TaskOutlinedIcon color='secondary' />
          <Typography
            variant='body1'
            variantMapping={{ body1: 'span' }}
            marginLeft='5px'
            noWrap
          >{pageTitle || 'Untitled'}
          </Typography>
        </Link>
      </TableCell>
      <TableCell>
        <Link color='inherit' href={workspaceProposals} sx={{ '& > *': { verticalAlign: 'middle' } }}>
          <Typography variant='body1'>{spaceName}</Typography>
        </Link>
      </TableCell>
      <TableCell align='center'>
        <ProposalStatusChip status={status} />
      </TableCell>
      <TableCell align='center'>
        <Button
          sx={{
            borderRadius: '18px',
            width: {
              xs: '100%',
              md: '100px'
            }
          }}
          href={proposalLink}
          variant={action ? 'contained' : 'outlined'}
        >
          {action ? ProposalActionRecord[action] : 'View'}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function ProposalTasksList ({
  tasks,
  error,
  mutateTasks
}: {
  mutateTasks: KeyedMutator<GetTasksResponse>;
  error: any;
  tasks: GetTasksResponse | undefined;
}) {
  const proposals = tasks?.proposals ? [...tasks.proposals.unmarked, ...tasks.proposals.marked] : [];

  useEffect(() => {
    async function main () {
      if (tasks?.proposals && tasks.proposals.unmarked.length !== 0) {
        await charmClient.tasks.markTasks(tasks.proposals.unmarked.map(proposal => ({ id: proposal.id, type: 'proposal' })));
        mutateTasks((_tasks) => {
          const unmarked = _tasks?.proposals.unmarked ?? [];
          return _tasks ? {
            ..._tasks,
            proposals: {
              marked: [...unmarked, ..._tasks.proposals.marked],
              unmarked: []
            }
          } : undefined;
        }, {
          revalidate: false
        });
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
    <Box overflow='auto'>
      <Table size='medium' aria-label='Nexus proposals table'>
        <TableHead>
          <TableRow>
            <TableCell width={400}>Proposal Name</TableCell>
            <TableCell>Workspace</TableCell>
            <TableCell align='center' width={SMALL_TABLE_CELL_WIDTH}>Status</TableCell>
            <TableCell align='center' width={SMALL_TABLE_CELL_WIDTH}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {proposals.map(proposal => <ProposalTasksListRow key={proposal.id} proposalTask={proposal} />)}
        </TableBody>
      </Table>
    </Box>
  );
}
