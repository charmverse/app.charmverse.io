'use client';

import { Button } from '@mui/material';
import { useAction } from 'next-safe-action/hooks';

import { useMdScreen } from 'hooks/useMediaScreens';
import { claimPointsAction } from 'lib/points/claimPointsAction';

export function PointsClaimButton() {
  const isDesktop = useMdScreen();
  const { execute, isExecuting } = useAction(claimPointsAction);
  return (
    <Button variant='contained' color='primary' fullWidth={isDesktop} disabled={isExecuting} onClick={() => execute()}>
      Claim now
    </Button>
  );
}
