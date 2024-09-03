'use client';

import { log } from '@charmverse/core/log';
import { Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

import { joinWaitlistAction } from 'lib/waitlistSlots/joinWaitlistAction';

export default function JoinWaitlistPage() {
  const router = useRouter();

  const { execute: joinWaitlist } = useAction(joinWaitlistAction, {
    onSuccess: async () => {
      router.push('/score');
    },
    onError(err) {
      log.error('Error on join waitlist', { error: err.error.serverError });
    }
  });

  return (
    <div>
      <Typography variant='h2'>Join the waitlist</Typography>

      <Button color='primary' onClick={() => joinWaitlist()} href=''>
        Join the waitlist
      </Button>
    </div>
  );
}
