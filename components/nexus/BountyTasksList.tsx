import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { BountyStatusNexusChip } from 'components/bounties/components/BountyStatusBadge';
import Button from 'components/common/Button';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import type { BountyTask } from 'lib/bounties/getBountyTasks';
import type { GetTasksResponse } from 'pages/api/tasks/list';

import Table from './components/NexusTable';

function BountiesTasksListRow ({ bountyTask }: { bountyTask: BountyTask }) {
  const { pageTitle, spaceName, spaceDomain, pagePath, action } = bountyTask;
  const bountyLink = `/${spaceDomain}/${pagePath}`;
  const workspaceBounties = `/${spaceDomain}/bounties`;

  return (
    <TableRow>
      <TableCell>
        <Link color='inherit' href={bountyLink}>
          <Typography
            variant='body1'
            noWrap
          >{pageTitle || 'Untitled'}
          </Typography>
        </Link>
      </TableCell>
      <TableCell>
        <Link color='inherit' href={workspaceBounties}>
          <Typography variant='body1'>{spaceName}</Typography>
        </Link>
      </TableCell>
      <TableCell align='center'>
        {action ? <BountyStatusNexusChip action={action} /> : 'No action'}
      </TableCell>
      <TableCell>
        <Button
          sx={{
            borderRadius: '18px',
            width: {
              xs: '100%',
              md: '100px'
            }
          }}
          href={bountyLink}
          disabled={!action}
        >
          Review
        </Button>
      </TableCell>
    </TableRow>
  );
}

function BountiesTasksList ({
  tasks,
  error,
  mutateTasks
}: {
  mutateTasks: KeyedMutator<GetTasksResponse>;
  error: any;
  tasks: GetTasksResponse | undefined;
}) {
  const bounties = tasks?.bounties ? [...tasks.bounties.unmarked, ...tasks.bounties.marked] : [];

  useEffect(() => {
    async function main () {
      if (tasks?.bounties && tasks.bounties.unmarked.length !== 0) {
        await charmClient.tasks.markTasks(tasks.bounties.unmarked.map(task => ({ id: task.id, type: 'bounty' })));
        mutateTasks((_tasks) => {
          const unmarked = _tasks?.bounties.unmarked ?? [];
          return _tasks ? {
            ..._tasks,
            bounties: {
              marked: [...unmarked, ..._tasks.bounties.marked],
              unmarked: []
            }
          } : undefined;
        }, {
          revalidate: false
        });
      }
    }
    main();
  }, [tasks?.bounties]);

  if (error) {
    return (
      <Box>
        <Alert severity='error'>
          There was an error. Please try again later!
        </Alert>
      </Box>
    );
  }
  else if (!tasks?.bounties) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  const filteredBounties = bounties.filter(b => !!b.action);
  const totalBounties = filteredBounties.length;

  if (totalBounties === 0) {
    return (
      <Card variant='outlined'>
        <Box p={3} textAlign='center'>
          <TaskOutlinedIcon />
          <Typography color='secondary'>You don't have any bounties to review right now</Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Box overflow='auto'>
      <Table size='medium' aria-label='Nexus bounty table'>
        <TableHead>
          <TableRow>
            <TableCell>Bounty Name</TableCell>
            <TableCell>Workspace</TableCell>
            <TableCell align='center' width={200}>Status</TableCell>
            <TableCell align='center' width={135}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredBounties.map(bounty => <BountiesTasksListRow key={bounty.id} bountyTask={bounty} />)}
        </TableBody>
      </Table>
    </Box>
  );
}

export default BountiesTasksList;
