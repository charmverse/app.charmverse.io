'use client';

import { log } from '@charmverse/core/log';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

import { joinWaitlistAction } from 'lib/waitlistSlots/joinWaitlistAction';

export default function JoinWaitlistButton() {
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
    <Button color='primary' onClick={() => joinWaitlist()}>
      Join the waitlist
    </Button>
  );
}
