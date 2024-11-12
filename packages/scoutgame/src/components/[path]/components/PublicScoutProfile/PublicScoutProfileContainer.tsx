'use client';

import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { Box, Stack, Paper, Typography } from '@mui/material';

import { BackButton } from 'components/common/Button/BackButton';
import { UserProfile } from 'components/common/Profile/UserProfile';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { BuilderInfo } from 'lib/builders/interfaces';
import type { BasicUserInfo } from 'lib/users/interfaces';

import { BuildersGallery } from '../../../common/Gallery/BuildersGallery';

import { PublicScoutProfileStats } from './PublicScoutProfileStats';

export type ScoutProfileProps = {
  scout: BasicUserInfo & {
    builderStatus?: BuilderStatus | null;
  };
  allTimePoints: number;
  seasonPoints: number;
  nftsPurchased: number;
  scoutedBuilders: BuilderInfo[];
};

export function PublicScoutProfileContainer({
  scout,
  allTimePoints,
  seasonPoints,
  nftsPurchased,
  scoutedBuilders
}: ScoutProfileProps) {
  const isDesktop = useMdScreen();
  return (
    <Box>
      {!isDesktop ? (
        <Paper sx={{ py: 2, mb: { xs: 1, md: 2 } }}>
          <Stack flexDirection='row'>
            <BackButton />
            <Box width='calc(100% - 50px)'>
              <UserProfile user={scout} avatarSize={isDesktop ? 'xLarge' : 'large'} />
            </Box>
          </Stack>
        </Paper>
      ) : null}
      <Paper
        sx={{
          my: 2,
          p: {
            xs: 0,
            md: 2
          },
          backgroundColor: {
            xs: 'transparent',
            md: 'background.dark'
          }
        }}
        elevation={0}
      >
        <PublicScoutProfileStats
          allTimePoints={allTimePoints}
          seasonPoints={seasonPoints}
          buildersScouted={scoutedBuilders.length}
          nftsPurchased={nftsPurchased}
        />
        <Typography variant='h6' my={2} color='secondary' fontWeight='500' textAlign='center'>
          Scouted Builders
        </Typography>
        {scoutedBuilders.length > 0 ? (
          <BuildersGallery builders={scoutedBuilders} columns={5} size={isDesktop ? 'large' : 'small'} />
        ) : (
          <Typography>This Scout hasn't discovered any Builders yet. Check back to see who they find!</Typography>
        )}
      </Paper>
    </Box>
  );
}
