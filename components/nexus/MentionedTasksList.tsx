import { Alert, Box, Card, Grid, Typography } from '@mui/material';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import { MentionedTask } from 'lib/mentions/interfaces';
import { DateTime } from 'luxon';
import UserDisplay from 'components/common/UserDisplay';
import { User } from '@prisma/client';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useEffect } from 'react';
import charmClient from 'charmClient';
import { GetTasksResponse } from 'pages/api/tasks/list';
import { KeyedMutator } from 'swr';

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
    bountyTitle,
    type
  }: MentionedTask & { marked: boolean }
) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : null;

  let mentionLink = '';
  let mentionTitle = '';

  if (type === 'bounty') {
    mentionLink = `${baseUrl}/${spaceDomain}/bounties/${bountyId}?mentionId=${mentionId}`;
    mentionTitle = `${bountyTitle || 'Untitled'} in ${spaceName}`;
  }
  else if (type === 'page') {
    mentionLink = `${baseUrl}/${spaceDomain}/${pagePath}?mentionId=${mentionId}`;
    mentionTitle = `${pageTitle || 'Untitled'} in ${spaceName}`;
  }
  else if (type === 'comment') {
    mentionLink = `${baseUrl}/${spaceDomain}/${pagePath}`; // No possible way to scroll to the correct mention as its inside a comment
    mentionTitle = `Comment in ${spaceName}`;
  }

  return (
    <Box position='relative'>
      {!marked ? (
        <VisibilityIcon
          fontSize='small'
          sx={{
            position: 'absolute',
            left: -35,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
      ) : null}
      <Link target='_blank' href={mentionLink}>
        <Card key={mentionId} sx={{ width: '100%', opacity: marked ? 0.75 : 1, px: 2, py: 1, my: 2, borderLeft: 0, borderRight: 0 }} variant='outlined'>
          <Grid justifyContent='space-between' alignItems='center' gap={1} container>
            <Grid
              item
              xs={12}
              sm={7}
              md={4}
              sx={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                mr: 1
              }}
              fontSize={{ sm: 16, xs: 18 }}
            >
              {text}
            </Grid>
            <Grid
              item
              xs={12}
              sm={4}
              md={2}
              justifyContent={{ sm: 'flex-end', md: 'initial', xs: 'initial' }}
              sx={{ display: 'flex' }}
            >
              <UserDisplay avatarSize='small' user={createdBy as User} />
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              sx={{
                fontSize: { xs: 14, sm: 'inherit' }
              }}
            >
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5
              }}
              >
                {mentionTitle}
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              sm={3}
              md={1.5}
              justifyContent={{ sm: 'flex-end', xs: 'initial' }}
              sx={{
                fontSize: { xs: 14, sm: 'inherit', display: 'flex' }
              }}
            >
              {DateTime.fromISO(createdAt).toRelative({ base: DateTime.now() })}
            </Grid>
          </Grid>
        </Card>
      </Link>
    </Box>
  );
}

interface MentionedTasksListProps {
  tasks: GetTasksResponse | undefined
  error: any
  mutateTasks: KeyedMutator<GetTasksResponse>
}

export default function MentionedTasksList ({ tasks, error, mutateTasks }: MentionedTasksListProps) {
  useEffect(() => {
    async function main () {
      if (tasks?.mentioned && tasks.mentioned.unmarked.length !== 0) {
        await charmClient.markTasks(tasks.mentioned.unmarked.map(unmarkedMentions => ({ id: unmarkedMentions.mentionId, type: 'mention' })));
        mutateTasks((_tasks) => {
          const unmarked = _tasks?.mentioned.unmarked ?? [];
          return _tasks ? {
            gnosis: _tasks.gnosis,
            mentioned: {
              marked: [..._tasks.mentioned.marked, ...unmarked],
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
  else if (!tasks?.mentioned) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  const totalMentions = (tasks?.mentioned.unmarked.length ?? 0) + (tasks?.mentioned.marked.length ?? 0);

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
    <>
      {tasks?.mentioned.unmarked.map((mentionedTask) => <MentionedTaskRow key={mentionedTask.mentionId} {...mentionedTask} marked={false} />)}
      {tasks?.mentioned.marked.map((mentionedTask) => <MentionedTaskRow key={mentionedTask.mentionId} {...mentionedTask} marked />)}
    </>
  );
}
