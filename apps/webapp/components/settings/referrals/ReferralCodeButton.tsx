import { AddLink, ContentCopy, InfoOutlined } from '@mui/icons-material';
import { Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import { useReferralCode } from 'charmClient/hooks/referrals';
import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { getAppUrl } from '@packages/lib/utils/browser';

export function ReferralCodeButton() {
  const { user } = useUser();
  const [requestCode, setRequestCode] = useState(false);
  const { data, isLoading, isValidating } = useReferralCode(user?.id, requestCode);
  const { showMessage } = useSnackbar();

  if (isLoading && !setRequestCode) {
    return null;
  }

  const refLink = `${getAppUrl()}?ref=${data?.code}`;

  return (
    <Stack my={1} alignItems='flex-start'>
      <Typography variant='subtitle1'>Your referral link</Typography>

      {data?.code ? (
        <Tooltip title='Copy referral link'>
          <Stack>
            <CopyToClipboard text={refLink} onCopy={() => showMessage('Referral link copied')}>
              <Button variant='text' color='secondary' size='small' sx={{ gap: 0.5 }}>
                <Typography variant='caption'>{refLink}</Typography>
                <ContentCopy fontSize='small' />
              </Button>
            </CopyToClipboard>
          </Stack>
        </Tooltip>
      ) : (
        <Button
          onClick={() => setRequestCode(true)}
          variant='outlined'
          color='secondary'
          size='small'
          loading={isLoading}
          sx={{ gap: 0.5 }}
        >
          <Typography variant='caption'>Get referral link</Typography>
          <AddLink fontSize='small' />
        </Button>
      )}
    </Stack>
  );
}
