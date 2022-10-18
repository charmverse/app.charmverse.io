import HowToVote from '@mui/icons-material/HowToVote';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { DateTime } from 'luxon';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import type { VoteDetailProps } from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import VoteDetail from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import Modal from 'components/common/Modal';
import VoteIcon from 'components/votes/components/VoteIcon';
import type { VoteTask } from 'lib/votes/interfaces';
import type { GetTasksResponse } from 'pages/api/tasks/list';

import Table from './components/NexusTable';

interface VoteTasksListProps {
  tasks: GetTasksResponse | undefined;
  error: any;
  mutateTasks: KeyedMutator<GetTasksResponse>;
}

/**
 * Page only needs to be provided for proposal type votes
 */
export function VoteTasksListRow ({ voteTask, handleVoteId }: { voteTask: VoteTask, handleVoteId: (voteId: string) => void }) {
  const {
    page: { path: pagePath, title: pageTitle },
    space: { domain: spaceDomain, name: spaceName },
    deadline, title: voteTitle, id
  } = voteTask;

  const voteLink = `/${spaceDomain}/${pagePath}?voteId=${id}`;
  const voteLocation = `${pageTitle || 'Untitled'} in ${spaceName}`;

  return (
    <TableRow>
      <TableCell>
        <Box alignItems='center' display='flex'>
          <VoteIcon {...voteTask} />
          <Typography variant='body1' variantMapping={{ body1: 'span' }} marginLeft='5px'>{voteTitle}</Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Link href={voteLink} variant='body1'>
          {voteLocation}
        </Link>
      </TableCell>
      <TableCell align='center'>
        <Typography>due {DateTime.fromJSDate(new Date(deadline)).toRelative({ base: DateTime.now() })}</Typography>
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
          onClick={() => handleVoteId(voteTask.id)}
        >
          Vote now
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function VoteTasksList ({ error, tasks, mutateTasks }: VoteTasksListProps) {

  const [selectedVoteId, setSelectedVoteId] = useState<string | undefined>();

  const handleVoteId = (voteId: string) => setSelectedVoteId(voteId);

  const removeVoteFromTask = (voteId: string) => {
    mutateTasks((taskList) => {
      return taskList ? {
        ...taskList,
        votes: taskList.votes.filter(vote => vote.id !== voteId)
      } : undefined;
    }, {
      revalidate: false
    });
  };

  const castVote: VoteDetailProps['castVote'] = async (voteId, choice) => {
    const userVote = await charmClient.votes.castVote(voteId, choice);
    removeVoteFromTask(voteId);
    return userVote;
  };

  const deleteVote: VoteDetailProps['deleteVote'] = async (voteId) => {
    // This is guaranteed to be inline votes so no need to add guard against proposal type votes
    await charmClient.votes.deleteVote(voteId);
    removeVoteFromTask(voteId);
  };

  const cancelVote: VoteDetailProps['cancelVote'] = async (voteId) => {
    await charmClient.votes.cancelVote(voteId);
    removeVoteFromTask(voteId);
  };

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

  const totalVotes = tasks?.votes.length ?? 0;

  if (totalVotes === 0) {
    return (
      <Card variant='outlined'>
        <Box p={3} textAlign='center'>
          <HowToVote />
          <Typography color='secondary'>You don't have any polls right now</Typography>
        </Box>
      </Card>
    );
  }

  const voteTask = tasks.votes.find(v => v.id === selectedVoteId);

  return (
    <Box overflow='auto'>
      <Table size='medium' aria-label='Nexus polls table'>
        <TableHead>
          <TableRow>
            <TableCell>Poll name</TableCell>
            <TableCell>Page name</TableCell>
            <TableCell align='center'>Due</TableCell>
            <TableCell width='135' align='center'>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.votes.map(vote => <VoteTasksListRow handleVoteId={handleVoteId} key={vote.id} voteTask={vote} />)}
          {tasks.votes.map(vote => <VoteTasksListRow handleVoteId={handleVoteId} key={vote.id} voteTask={vote} />)}
        </TableBody>
      </Table>
      <Modal
        title='Poll details'
        size='large'
        open={!!selectedVoteId && !!voteTask}
        onClose={() => setSelectedVoteId(undefined)}
      >
        {voteTask && (
          <VoteDetail
            vote={voteTask}
            detailed
            castVote={castVote}
            deleteVote={deleteVote}
            cancelVote={cancelVote}
          />
        )}
      </Modal>
    </Box>
  );
}
