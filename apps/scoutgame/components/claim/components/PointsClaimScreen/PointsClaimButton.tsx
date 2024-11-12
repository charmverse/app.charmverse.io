'use client';

import { LoadingButton } from '@mui/lab';

export function PointsClaimButton({ isExecuting, handleClaim }: { isExecuting: boolean; handleClaim: VoidFunction }) {
  return (
    <LoadingButton
      variant='contained'
      color='primary'
      sx={{
        width: {
          xs: 'fit-content',
          md: '100%'
        }
      }}
      loading={isExecuting}
      data-test='claim-points-button'
      disabled={isExecuting}
      onClick={handleClaim}
    >
      Claim
    </LoadingButton>
  );
}
