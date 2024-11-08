'use client';

import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { Box, Dialog, IconButton, Paper, Stack, Typography } from '@mui/material';
import type { BonusPartner } from '@packages/scoutgame/bonus';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { Suspense, useState } from 'react';

import { LoadingComponent } from 'components/common/Loading/LoadingComponent';
import { useUser } from 'components/layout/UserProvider';
import { claimPointsAction } from 'lib/points/claimPointsAction';

import { BonusPartnersDisplay } from './BonusPartnersDisplay';
import { PointsClaimButton } from './PointsClaimButton';
import { PointsClaimModal } from './PointsClaimModal/PointsClaimModal';
import { PointsClaimSocialShare } from './PointsClaimModal/PointsClaimSocialShare';

export function PointsClaimScreen({
  totalUnclaimedPoints,
  displayName,
  bonusPartners
}: {
  totalUnclaimedPoints: number;
  displayName: string;
  bonusPartners: BonusPartner[];
}) {
  const { executeAsync, isExecuting } = useAction(claimPointsAction);
  const { refreshUser, user } = useUser();
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
      {user ? (
        <Dialog open={showModal} onClose={handleCloseModal} data-test='claim-points-success-modal'>
          <IconButton onClick={handleCloseModal} sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1, m: 1 }}>
            <CancelOutlinedIcon color='primary' />
          </IconButton>
          <Stack position='relative' width={600} height={600}>
            <Image
              style={{
                position: 'absolute',
                top: 0,
                left: 0
              }}
              width={600}
              height={600}
              src='/images/claim-share-background.png'
              alt='Claim success modal'
            />
            <Suspense
              fallback={
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
                  <LoadingComponent />
                </Box>
              }
            >
              <PointsClaimModal userId={user.id} displayName={displayName} claimedPoints={totalUnclaimedPoints} />
            </Suspense>
          </Stack>
          <PointsClaimSocialShare />
        </Dialog>
      ) : null}
    </Paper>
  );
}
