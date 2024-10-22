'use client';

import { Button, Dialog, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';

import { useUser } from 'components/layout/UserProvider';
import { claimPointsAction } from 'lib/points/claimPointsAction';

export function PointsClaimButton() {
  const { executeAsync, isExecuting, result } = useAction(claimPointsAction);
  const [showModal, setShowModal] = useState(false);
  const { refreshUser } = useUser();

  const handleClaim = async () => {
    await executeAsync();
    setShowModal(true);
    await refreshUser();
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <Button
        variant='contained'
        color='primary'
        sx={{
          width: {
            xs: 'fit-content',
            md: '100%'
          }
        }}
        disabled={isExecuting}
        onClick={handleClaim}
      >
        Claim
      </Button>
      <Dialog open={showModal} onClose={handleCloseModal}>
        <Stack gap={2} textAlign='center' my={2}>
          <Typography color='secondary' variant='h5' fontWeight={600}>
            Congratulations!
          </Typography>
          <Typography>You claimed {result?.data?.claimedPoints.toLocaleString()} points</Typography>
          <Image src='/images/trophy_sticker.jpg' alt='Success' width={300} height={300} />
          <div>
            <Button variant='outlined' color='primary' onClick={handleCloseModal}>
              Return to app
            </Button>
          </div>
        </Stack>
      </Dialog>
    </>
  );
}
