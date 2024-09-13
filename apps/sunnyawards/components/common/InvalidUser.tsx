'use client';

import { log } from '@charmverse/core/log';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import { logoutAction } from '@connect-shared/lib/session/logoutAction';
import { Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

export function InvalidUser() {
  const router = useRouter();
  const { execute: logoutUser, isExecuting: isExecutingLogout } = useAction(logoutAction, {
    onSuccess: async () => {
      await revalidatePathAction();
      router.push('/');
    },
    onError: (error) => {
      log.error('Error invalidating the user', { error });
    }
  });

  return (
    <PageWrapper textAlign='center'>
      <Typography mb={2}>Your user seems invalid. Please refresh and login again</Typography>
      <Button data-test='invalidate-user-button' disabled={isExecutingLogout} onClick={() => logoutUser({})}>
        Refresh
      </Button>
    </PageWrapper>
  );
}
