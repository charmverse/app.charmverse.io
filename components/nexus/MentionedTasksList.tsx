import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import BountyIcon from '@mui/icons-material/RequestPage';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { DateTime } from 'luxon';
import { useEffect, useMemo } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import UserDisplay from 'components/common/UserDisplay';
import type { MentionedTask } from 'lib/mentions/interfaces';
import type { GetTasksResponse } from 'pages/api/tasks/list';

function MentionedTaskRow (
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
  }: MentionedTask & { marked: boolean }
) {
  const { mentionLink, mentionTitle } = useMemo(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : null;

    if (type === 'bounty' && bountyId) {
      return {
        mentionLink: `${baseUrl}/${spaceDomain}/bounties?bountyId=${bountyId}`,
        mentionTitle: `${pageTitle} in ${spaceName}`
      };
    }
    else {
      return {
        mentionLink: `${baseUrl}/${spaceDomain}/${pagePath}?${commentId ? `commentId=${commentId}` : `mentionId=${mentionId}`}`,
        mentionTitle: `${pageTitle} in ${spaceName}`
      };
    }
  }, [type, bountyId, spaceDomain, pageTitle, spaceName, pagePath, commentId, mentionId]);

  return (
    <TableRow>
      <TableCell>
        {!marked && (
          <VisibilityIcon
            fontSize='small'
            sx={{
              position: 'absolute',
              left: '-15px'
            }}
          />
        )}
        <Link
          color='inherit'
          href={mentionLink}
          sx={{
            maxWidth: {
              xs: '130px',
              sm: '200px',
              md: '400px'
            }
          }}
          display='flex'
        >
          {type === 'bounty' ? <BountyIcon fontSize='small' /> : type === 'page' ? <DescriptionOutlinedIcon fontSize='small' /> : null}
          <Typography
            marginLeft='5px'
            noWrap
          >{text}
          </Typography>
        </Link>
      </TableCell>
      <TableCell>
        {createdBy && (
          <Link color='inherit' href={mentionLink}>
            <UserDisplay avatarSize='small' user={createdBy} />
          </Link>
        )}
      </TableCell>
      <TableCell>
        <Link color='inherit' href={mentionLink} variant='body1'>
          {mentionTitle}
        </Link>
      </TableCell>
      <TableCell align='center'>
        <Link color='inherit' href={mentionLink} variant='body1'>
          {DateTime.fromISO(createdAt).toRelative({ base: DateTime.now() })}
        </Link>
      </TableCell>
    </TableRow>
  );
}

interface MentionedTasksListProps {
  tasks: GetTasksResponse | undefined;
  error: any;
  mutateTasks: KeyedMutator<GetTasksResponse>;
}

export default function MentionedTasksList ({ tasks, error, mutateTasks }: MentionedTasksListProps) {
  useEffect(() => {
    async function main () {
      if (tasks?.mentioned && tasks.mentioned.unmarked.length !== 0) {
        await charmClient.tasks.markTasks(tasks.mentioned.unmarked.map(unmarkedMentions => ({ id: unmarkedMentions.mentionId, type: 'mention' })));
        mutateTasks((_tasks) => {
          const unmarked = _tasks?.mentioned.unmarked ?? [];
          return _tasks ? {
            votes: _tasks.votes,
            mentioned: {
              marked: [...unmarked, ..._tasks.mentioned.marked],
              unmarked: []
            },
            proposals: _tasks.proposals
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
  else if (!tasks?.mentioned) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  const totalMentions = (tasks.mentioned.unmarked.length ?? 0) + (tasks.mentioned.marked.length ?? 0);

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
              <TableCell width={160}>Commenter</TableCell>
              <TableCell>Page Title</TableCell>
              <TableCell width={140} align='center'>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.mentioned.unmarked.map((mentionedTask) => <MentionedTaskRow key={mentionedTask.mentionId} {...mentionedTask} marked={false} />)}
            {tasks.mentioned.marked.map((mentionedTask) => <MentionedTaskRow key={mentionedTask.mentionId} {...mentionedTask} marked />)}
          </TableBody>
        </Table>
      </Box>
    </Box>

  );
}
