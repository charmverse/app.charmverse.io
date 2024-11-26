'use client';

import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { Box, Dialog, IconButton, Paper, Stack, Typography } from '@mui/material';
import type { BonusPartner } from '@packages/scoutgame/bonus';
import { getLastWeek } from '@packages/scoutgame/dates';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';

import { claimPointsAction } from '../../../../actions/claimPointsAction';
import { revalidateClaimPointsAction } from '../../../../actions/revalidateClaimPointsAction';
import { useUser } from '../../../../providers/UserProvider';

import { BonusPartnersDisplay } from './BonusPartnersDisplay';
import { PointsClaimButton } from './PointsClaimButton';
import { PointsClaimSocialShare } from './PointsClaimModal/PointsClaimSocialShare';

export function PointsClaimScreen({
  totalUnclaimedPoints,
  displayName,
  bonusPartners,
  builders,
  repos
}: {
  totalUnclaimedPoints: number;
  displayName: string;
  bonusPartners: BonusPartner[];
  builders: {
    farcasterHandle?: string;
    displayName: string;
  }[];
  repos: string[];
}) {
  const { executeAsync, isExecuting, result } = useAction(claimPointsAction);
  const { refreshUser, user } = useUser();
  const [showModal, setShowModal] = useState(false);
  const { executeAsync: revalidateClaimPoints } = useAction(revalidateClaimPointsAction);

  const handleClaim = async () => {
    await executeAsync();
    await refreshUser();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    revalidateClaimPoints();
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
      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        data-test='claim-points-success-modal'
        PaperProps={{
          sx: {
            width: '100%'
          }
        }}
      >
        <IconButton onClick={handleCloseModal} sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1, m: 1 }}>
          <CancelOutlinedIcon color='primary' />
        </IconButton>
        <Stack
          sx={{
            width: '100%',
            height: '100%',
            aspectRatio: '1/1',
            maxWidth: 600,
            maxHeight: 600,
            position: 'relative'
          }}
        >
          <img
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            src={`https://cdn.charmverse.io/points-claim/${user!.id}/${result.data!.week}.png`}
            alt='Claim success modal'
          />
        </Stack>
        <Stack width='100%'>
          <PointsClaimSocialShare
            isBuilder={repos.length > 0}
            totalUnclaimedPoints={totalUnclaimedPoints}
            builders={builders}
            userPath={user!.path}
            week={result.data!.week}
          />
        </Stack>
      </Dialog>
    </Paper>
  );
}
