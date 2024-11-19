'use client';

import { log } from '@charmverse/core/log';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

export default function JoinWaitlistButton() {
  const router = useRouter();

  return (
    <Button color='primary' disabled>
      Waitlist Closed
    </Button>
  );
}
