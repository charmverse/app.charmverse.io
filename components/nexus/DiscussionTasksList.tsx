import VisibilityIcon from '@mui/icons-material/Visibility';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DateTime } from 'luxon';
import { useEffect, useMemo } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import UserDisplay from 'components/common/UserDisplay';
import type { DiscussionTask } from 'lib/discussion/interfaces';
import type { GetTasksResponse } from 'pages/api/tasks/list';

import Table from './components/NexusTable';

function DiscussionTaskRow (
  {
    createdAt,
    marked,
    pagePath,
    spaceDomain,
    spaceName,
    pageTitle,
    mentionId,
    createdBy,
    text,
    bountyId,
    type,
    commentId
  }: DiscussionTask & { marked: boolean }
) {
  const { discussionLink, discussionTitle } = useMemo(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : null;

    if (type === 'bounty' && bountyId) {
      return {
        discussionLink: `${baseUrl}/${spaceDomain}/bounties?bountyId=${bountyId}`,
        discussionTitle: `${pageTitle}`
      };
    }
    else {
      return {
        discussionLink: `${baseUrl}/${spaceDomain}/${pagePath}?${commentId ? `commentId=${commentId}` : `mentionId=${mentionId}`}`,
        discussionTitle: `${pageTitle}`
      };
    }
  }, [type, bountyId, spaceDomain, pageTitle, pagePath, commentId, mentionId]);

  return (
    <TableRow>
      <TableCell>
        <Box display='flex'>
          {!marked && (
            <VisibilityIcon
              fontSize='small'
              sx={{
                position: 'absolute',
                left: '-15px'
              }}
            />
          )}
          {createdBy && (
            <Tooltip title={createdBy.username}>
              <div>
                <UserDisplay avatarSize='small' user={createdBy} hideName={true} marginRight='10px' />
              </div>
            </Tooltip>
          )}
          <Link
            href={discussionLink}
            variant='body1'
            noWrap
            color='inherit'
            sx={{
              maxWidth: {
                xs: '130px',
                sm: '200px',
                md: '400px'
              }
            }}
          >
            {text}
          </Link>
        </Box>
      </TableCell>
      <TableCell>
        <Typography noWrap>{spaceName}</Typography>
      </TableCell>
      <TableCell>
        <Link color='inherit' href={discussionLink} variant='body1' noWrap>
          {discussionTitle}
        </Link>
      </TableCell>
      <TableCell align='center'>
        <Link color='inherit' href={discussionLink} variant='body1' noWrap>
          {DateTime.fromISO(createdAt).toRelative({ base: DateTime.now() })}
        </Link>
      </TableCell>
    </TableRow>
  );
}

interface DiscussionTasksListProps {
  tasks: GetTasksResponse | undefined;
  error: any;
  mutateTasks: KeyedMutator<GetTasksResponse>;
}

export default function DiscussionTasksList ({ tasks, error, mutateTasks }: DiscussionTasksListProps) {

  useEffect(() => {
    async function main () {
      if (tasks?.discussions && tasks.discussions.unmarked.length !== 0) {
        await charmClient.tasks.markTasks(tasks.discussions.unmarked.map(unmarkedDiscussion => ({ id: unmarkedDiscussion.mentionId ?? unmarkedDiscussion.commentId ?? '', type: 'mention' })));
      }
    }

    main();

    return () => {
      if (tasks?.discussions && tasks.discussions.unmarked.length !== 0) {
        mutateTasks((_tasks) => {
          const unmarked = _tasks?.discussions.unmarked ?? [];
          return _tasks ? {
            ..._tasks,
            discussions: {
              marked: [...unmarked, ..._tasks.discussions.marked],
              unmarked: []
            }
          } : undefined;
        }, {
          revalidate: false
        });
      }
    };
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
  else if (!tasks?.discussions) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  const totalMentions = (tasks.discussions.unmarked.length ?? 0) + (tasks.discussions.marked.length ?? 0);

  if (totalMentions === 0) {
    return (
      <Card variant='outlined'>
        <Box p={3} textAlign='center'>
          <Typography color='secondary'>You don't have any mentions right now</Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Box position='relative'>
      <Box overflow='auto'>
        <Table size='medium' aria-label='Nexus proposals table'>
          <TableHead>
            <TableRow>
              <TableCell>Comment</TableCell>
              <TableCell width={200}>Workspace</TableCell>
              <TableCell width={200}>Page</TableCell>
              <TableCell width={140} align='center'>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.discussions.unmarked.map((discussionTask) => <DiscussionTaskRow key={discussionTask.commentId ?? discussionTask.mentionId ?? ''} {...discussionTask} marked={false} />)}
            {tasks.discussions.marked.map((discussionTask) => <DiscussionTaskRow key={discussionTask.commentId ?? discussionTask.mentionId ?? ''} {...discussionTask} marked />)}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
