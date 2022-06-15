import { Alert, Box, Card, Grid } from '@mui/material';
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
    text
  }: MentionedTask & { marked: boolean }
) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : null;

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
      <Link target='_blank' href={baseUrl ? `${baseUrl}/${spaceDomain}/${pagePath}?mentionId=${mentionId}` : ''}>
        <Card key={mentionId} sx={{ width: '100%', opacity: marked ? 0.75 : 1, p: 1.5, my: 2, borderLeft: 0, borderRight: 0 }} variant='outlined'>
          <Grid justifyContent='space-between' alignItems='center' container>
            <Grid
              item
              xs={4}
              sx={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                mr: 1
              }}
            >
              {text}
            </Grid>
            <Grid
              item
              xs={2}
            >
              <UserDisplay avatarSize='small' user={createdBy as User} />
            </Grid>
            <Grid
              item
              xs={3}
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
                {pageTitle} in {spaceName}
              </Box>
            </Grid>
            <Grid
              item
              xs={2}
              sx={{
                fontSize: { xs: 14, sm: 'inherit' }
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
}

export default function MentionedTasksList ({ tasks, error }: MentionedTasksListProps) {
  useEffect(() => {
    async function main () {
      if (tasks?.mentioned && tasks.mentioned.unmarked.length !== 0) {
        await charmClient.markTasks(tasks.mentioned.unmarked.map(unmarkedMentions => ({ id: unmarkedMentions.mentionId, type: 'mention' })));
      }
    }

    if (tasks?.mentioned) {
      main();
    }
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

  return (
    <>
      {tasks?.mentioned.unmarked.map((mentionedTask) => <MentionedTaskRow key={mentionedTask.mentionId} {...mentionedTask} marked={false} />)}
      {tasks?.mentioned.marked.map((mentionedTask) => <MentionedTaskRow key={mentionedTask.mentionId} {...mentionedTask} marked />)}
    </>
  );
}
