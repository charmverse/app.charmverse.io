import { Box, Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { BonusPartnersDisplay } from './BonusPartnersDisplay';
import { PointsClaimButton } from './PointsClaimButton';

export async function PointsClaimScreen({
  totalUnclaimedPoints,
  username,
  bonusPartners
}: {
  totalUnclaimedPoints: number;
  username: string;
  bonusPartners: string[];
}) {
  if (!totalUnclaimedPoints) {
    return (
      <Paper
        sx={{
          minHeight: 150,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.dark'
        }}
      >
        <Typography textAlign='center' color='secondary' variant='h5'>
          Hey {username},
        </Typography>
        <Typography textAlign='center' variant='h6'>
          You have no rewards to claim.
          <br />
          Keep playing to earn more!
        </Typography>
      </Paper>
    );
  }

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
        flexDirection: 'column'
      }}
    >
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
            <b>{username}</b> <span style={{ fontSize: '0.8em' }}>will receive</span>
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
          <PointsClaimButton />
        </Box>
      </Stack>
    </Paper>
  );
}
