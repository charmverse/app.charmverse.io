import { Grid, Typography } from '@mui/material';

import { Button } from 'components/common/Button';
import Link from 'components/common/Link';
import { isProdEnv } from 'config/constants';
import { useIsAdmin } from 'hooks/useIsAdmin';

export function ConnectBoto() {
  const isAdmin = useIsAdmin();
  return (
    <Grid container direction='row' gap={2} justifyContent='space-between' alignItems='center'>
      <Grid item>
        <Typography variant='body2'>
          Connect your space to Discord or Telegram via Boto to receive notifications about Proposals.
        </Typography>
        <Typography variant='body2'>
          You need an <Link href='/api-docs'>API Key</Link> to use Boto.
        </Typography>
      </Grid>
      {isAdmin && (
        <Grid item>
          <Button external target='_blank' href='https://boto.io/integrations/charmverse'>
            Connect
          </Button>
        </Grid>
      )}
    </Grid>
  );
}
