import HowToVote from '@mui/icons-material/HowToVote';
import { Alert, Box, Card, Grid, Typography } from '@mui/material';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import type { VoteDetailProps } from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import VoteDetail from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import Modal from 'components/common/Modal';
import VoteIcon from 'components/votes/components/VoteIcon';
import type { VoteTask } from 'lib/votes/interfaces';
import { DateTime } from 'luxon';
import type { GetTasksResponse } from 'pages/api/tasks/list';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';

interface VoteTasksListProps {
  tasks: GetTasksResponse | undefined;
  error: any;
  mutateTasks: KeyedMutator<GetTasksResponse>;
}

/**
 * Page only needs to be provided for proposal type votes
 */
export function VoteTasksListRow (
  props: {voteTask: VoteTask; mutateTasks: KeyedMutator<GetTasksResponse>;}
) {
  const {
    voteTask,
    mutateTasks
  } = props;

  const {
    page: { path: pagePath, title: pageTitle },
    space: { domain: spaceDomain, name: spaceName },
    deadline, title: voteTitle, id
  } = voteTask;

  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);

  const voteLink = `/${spaceDomain}/${pagePath}?voteId=${id}`;
  const voteLocation = `${pageTitle || 'Untitled'} in ${spaceName}`;

  function removeVoteFromTask (voteId: string) {
    mutateTasks((tasks) => {
      return tasks ? {
        ...tasks,
        votes: tasks.votes.filter(vote => vote.id !== voteId)
      } : undefined;
    }, {
      revalidate: false
    });
  }

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
            <VoteIcon {...voteTask} />
            {voteTitle}
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
            <Link href={voteLink}>
              {voteLocation}
            </Link>
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            md={2}
            sx={{
              fontSize: { xs: 14, sm: 'inherit' }
            }}
          >
            due {DateTime.fromJSDate(new Date(deadline)).toRelative({ base: DateTime.now() })}
          </Grid>
          <Grid
            item
            xs={12}
            sm={2}
            md={1}
          >
            <Button onClick={() => {
              setIsVoteModalOpen(true);
            }}
            >Vote now
            </Button>
          </Grid>
        </Grid>
      </Card>
      <Modal
        title='Poll details'
        size='large'
        open={isVoteModalOpen}
        onClose={() => {
          setIsVoteModalOpen(false);
        }}
      >
        <VoteDetail
          vote={voteTask}
          detailed
          castVote={castVote}
          deleteVote={deleteVote}
          cancelVote={cancelVote}
        />
      </Modal>
    </Box>
  );
}

export function VoteTasksList ({ error, tasks, mutateTasks }: VoteTasksListProps) {

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

  return (
    <>
      {tasks.votes.map(vote => <VoteTasksListRow mutateTasks={mutateTasks} key={vote.id} voteTask={vote} />)}
    </>
  );
}
