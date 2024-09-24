'use client';

import { Button } from '@mui/material';
import { useAction } from 'next-safe-action/hooks';

import { claimPointsAction } from 'lib/points/claimPoints/claimPointsAction';

export function PointsClaimButton() {
  const { execute, isExecuting } = useAction(claimPointsAction);
  return (
    <Button variant='contained' color='primary' disabled={isExecuting} onClick={() => execute()}>
      Claim now
    </Button>
  );
}
