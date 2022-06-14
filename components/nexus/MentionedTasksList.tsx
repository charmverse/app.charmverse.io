import { Alert, Box, Card, Grid, Typography } from '@mui/material';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import { MentionedTask } from 'lib/mentions/interfaces';
import { DateTime } from 'luxon';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import useTasks from './hooks/useTasks';

function MentionedTaskRow ({ createdAt, pagePath, spaceDomain, spaceName, mentionId }: MentionedTask) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : null;
  return (
    <Card key={mentionId} sx={{ px: 1, my: 2, borderLeft: 0, borderRight: 0 }} variant='outlined'>
      <Grid justifyContent='space-between' alignItems='center' container>
        <Grid
          item
          xs={4}
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
            >{spaceDomain} <OpenInNewIcon fontSize='small' />
            </Link>
          </Typography>
        </Grid>
        <Grid
          item
          xs={4}
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
            >Link <OpenInNewIcon fontSize='small' />
            </Link>
          </Typography>
        </Grid>
        <Grid
          item
          xs={4}
          sx={{
            fontSize: { xs: 14, sm: 'inherit' }
          }}
        >
          {DateTime.fromISO(createdAt).toRelative({ base: DateTime.now() })}
        </Grid>
      </Grid>
    </Card>
  );
}

export default function MentionedTasksList () {
  const { tasks, error } = useTasks();

  if (tasks?.mentioned.length === 0) {
    if (error) {
      return (
        <Box>
          <Alert severity='error'>
            There was an error. Please try again later!
          </Alert>
        </Box>
      );
    }
    else {
      return <LoadingComponent height='200px' isLoading={true} />;
    }
  }

  return (
    tasks?.mentioned.map((mentionedTask) => <MentionedTaskRow {...mentionedTask} />)
  );
}
