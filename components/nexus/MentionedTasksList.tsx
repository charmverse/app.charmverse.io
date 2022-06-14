import { Alert, Box, Card, Grid, Typography } from '@mui/material';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import { MentionedTask } from 'lib/mentions/interfaces';
import { DateTime } from 'luxon';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import UserDisplay from 'components/common/UserDisplay';
import { User } from '@prisma/client';
import useTasks from './hooks/useTasks';

function MentionedTaskRow (
  {
    createdAt,
    marked,
    pagePath,
    spaceDomain,
    spaceName,
    pageTitle,
    mentionId,
    createdBy
  }: MentionedTask & { marked: boolean }
) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : null;
  return (
    <Card key={mentionId} sx={{ opacity: marked ? 0.75 : 1, p: 1.5, my: 2, borderLeft: 0, borderRight: 0 }} variant='outlined'>
      <Grid justifyContent='space-between' alignItems='center' container>
        <Grid
          item
          xs={2}
          sx={{
            fontSize: { xs: 14, sm: 'inherit' }
          }}
        >
          <Typography variant='body2'>
            <Link
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5
              }}
              href={baseUrl ? `${baseUrl}/${spaceDomain}` : ''}
              external
              target='_blank'
            >{spaceName} <OpenInNewIcon fontSize='small' />
            </Link>
          </Typography>
        </Grid>
        <Grid
          item
          xs={2}
          sx={{
            fontSize: { xs: 14, sm: 'inherit' }
          }}
        >
          <Typography variant='body2'>
            <Link
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5
              }}
              href={baseUrl ? `${baseUrl}/${spaceDomain}/${pagePath}?mentionId=${mentionId}` : ''}
              external
              target='_blank'
            >{pageTitle} <OpenInNewIcon fontSize='small' />
            </Link>
          </Typography>
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
        <Grid
          item
          xs={2}
        >
          <UserDisplay avatarSize='small' linkToProfile user={createdBy as User} />
        </Grid>
      </Grid>
    </Card>
  );
}

export default function MentionedTasksList () {
  const { tasks, error } = useTasks();

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
      {tasks?.mentioned.unmarked.map((mentionedTask) => <MentionedTaskRow {...mentionedTask} marked />)}
      {tasks?.mentioned.marked.map((mentionedTask) => <MentionedTaskRow {...mentionedTask} marked={false} />)}
    </>
  );
}
