'use client';

import { Box, Button, Dialog, Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';

import { useUser } from 'components/layout/UserProvider';
import { claimPointsAction } from 'lib/points/claimPointsAction';

import { BonusPartnersDisplay } from './BonusPartnersDisplay';
import { PointsClaimButton } from './PointsClaimButton';

function PointsClaimSuccessModal({
  showModal,
  handleCloseModal,
  claimedPoints
}: {
  showModal: boolean;
  handleCloseModal: VoidFunction;
  claimedPoints: number;
}) {
  return (
    <Dialog open={showModal} onClose={handleCloseModal} data-testid='claim-points-success-modal'>
      <Stack gap={2} textAlign='center' my={2}>
        <Typography color='secondary' variant='h5' fontWeight={600}>
          Congratulations!
        </Typography>
        <Typography>You claimed {claimedPoints.toLocaleString()} points</Typography>
        <Image src='/images/trophy_sticker.jpg' alt='Success' width={300} height={300} />
        <div>
          <Button variant='outlined' color='primary' onClick={handleCloseModal}>
            Return to app
          </Button>
        </div>
      </Stack>
    </Dialog>
  );
}

export function PointsClaimScreen({
  totalUnclaimedPoints,
  displayName,
  bonusPartners
}: {
  totalUnclaimedPoints: number;
  displayName: string;
  bonusPartners: string[];
}) {
  const { executeAsync, isExecuting, result } = useAction(claimPointsAction);
  const { refreshUser } = useUser();
  const [showModal, setShowModal] = useState(false);

  const handleClaim = async () => {
    await executeAsync();
    await refreshUser();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <Paper
      sx={{
        gap: 1,
        padding: 4,
        borderRadius: 2,
        display: 'flex',
        backgroundColor: 'background.dark',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}
    >
      {totalUnclaimedPoints ? (
        <>
          <Typography variant='h5' textAlign='center' fontWeight={500} color='secondary'>
            Congratulations!
          </Typography>
          <Typography variant='h5' textAlign='center'>
            You have earned Scout Points!
          </Typography>

          <Stack
            sx={{
              flexDirection: {
                xs: 'row',
                md: 'column'
              },
              gap: 1,
              justifyContent: 'space-between',
              width: '100%',
              alignItems: 'center'
            }}
          >
            <Stack flexDirection='column' alignItems='center' gap={0.5}>
              <Typography variant='h6'>
                <b>{displayName}</b> <span style={{ fontSize: '0.8em' }}>will receive</span>
              </Typography>
              <Stack flexDirection='row' alignItems='center' gap={1}>
                <Typography variant='h4' fontWeight={500}>
                  {totalUnclaimedPoints}
                </Typography>
                <Image
                  width={35}
                  height={35}
                  style={{ marginRight: 10 }}
                  src='/images/profile/scout-game-icon.svg'
                  alt='Scouts'
                />{' '}
                {bonusPartners.length > 0 ? '+ ' : ''}
                <BonusPartnersDisplay bonusPartners={bonusPartners} size={35} />
              </Stack>
            </Stack>
            <Box width={{ xs: 'fit-content', md: '100%' }}>
              <PointsClaimButton isExecuting={isExecuting} handleClaim={handleClaim} />
            </Box>
          </Stack>
        </>
      ) : (
        <>
          <Typography textAlign='center' color='secondary' variant='h5'>
            Hey {displayName},
          </Typography>
          <Typography textAlign='center' variant='h6'>
            You have no rewards to claim.
            <br />
            Keep playing to earn more!
          </Typography>
        </>
      )}
      <PointsClaimSuccessModal
        showModal={showModal}
        handleCloseModal={handleCloseModal}
        claimedPoints={result?.data?.claimedPoints ?? 0}
      />
    </Paper>
  );
}
