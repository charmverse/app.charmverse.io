'use client';

import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { Dialog, IconButton, Stack, Typography } from '@mui/material';
import { getCurrentSeasonWeekNumber } from '@packages/scoutgame/dates';
import Image from 'next/image';

import { PointsClaimSocialShare } from './PointsClaimSocialShare';

export function PointsClaimBuilderScreen({
  showModal,
  handleCloseModal,
  claimedPoints,
  displayName,
  repos
}: {
  displayName: string;
  showModal: boolean;
  handleCloseModal: VoidFunction;
  claimedPoints: number;
  repos: string[];
}) {
  const currentWeek = getCurrentSeasonWeekNumber();
  return (
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
        <Stack
          sx={{
            transform: 'translate(-50%, -50%)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '75%',
            height: '75%',
            alignItems: 'center',
            zIndex: 1,
            mt: 4
          }}
        >
          <Typography variant='h4' fontFamily='K2D'>
            TOP BUILDER
          </Typography>
          <Typography variant='h6' color='secondary' fontWeight={600} mt={2}>
            {displayName}
          </Typography>
          <Typography variant='h6' textAlign='center'>
            scored {claimedPoints} Scout Points <br /> in week {currentWeek} of
          </Typography>
          <Typography fontWeight='bold' variant='h6' textAlign='center' fontFamily='Posterama'>
            SCOUT GAME!
          </Typography>
          <Image src='/images/diamond.png' alt='Diamond' width={100} height={100} />
          <Stack gap={0.5} width='100%' px={2} mt={1}>
            <Typography variant='h6' fontWeight={700}>
              Contributions:
            </Typography>
            {repos.map((repo) => (
              <Typography key={repo} textOverflow='ellipsis'>
                {repo}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Stack>
      <PointsClaimSocialShare />
    </Dialog>
  );
}
