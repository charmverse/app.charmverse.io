import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined';
import { Chip, Grid, List, ListItem, Stack, TextField, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import Link from 'components/common/Link';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { isProdEnv } from 'config/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';

const collablandStoreUrl = isProdEnv ? 'https://cc.collab.land/dashboard' : 'https://cc-qa.collab.land/dashboard';

export function ConnectBoto() {
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
      <Grid item>
        <Button external target='_blank' href='https://boto.io/integrations/charmverse'>
          Connect
        </Button>
      </Grid>
    </Grid>
  );
}
