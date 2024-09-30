'use client';

import { Box, Stack, Paper, Typography } from '@mui/material';

import { BackButton } from 'components/common/Button/BackButton';
import { BuildersGallery } from 'components/common/Gallery/BuildersGallery';
import { UserProfile } from 'components/common/Profile/UserProfile';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { BuilderInfo } from 'lib/builders/interfaces';
import type { BasicUserInfo } from 'lib/users/interfaces';

import { PublicProfileTabsMenu } from '../../PublicProfileTabsMenu';

import { PublicScoutProfileStats } from './PublicScoutProfileStats';

export type ScoutProfileProps = {
  scout: BasicUserInfo;
  allTimePoints: number;
  seasonPoints: number;
  nftsPurchased: number;
  scoutedBuilders: BuilderInfo[];
  tab: string;
  userId?: string;
};

export function PublicScoutProfileContainer({
  scout,
  allTimePoints,
  seasonPoints,
  nftsPurchased,
  scoutedBuilders,
  tab,
  userId
}: ScoutProfileProps) {
  const isDesktop = useMdScreen();
  return (
    <Box>
      {!isDesktop ? <PublicProfileTabsMenu tab={tab} username={scout.username} /> : null}
      <Paper sx={{ py: 2, my: { xs: 1, md: 2 } }}>
        <Stack flexDirection='row'>
          <BackButton />
          <Box width='calc(100% - 50px)'>
            <UserProfile user={scout} avatarSize={isDesktop ? 'xLarge' : 'large'} />
          </Box>
        </Stack>
      </Paper>
      {isDesktop ? <PublicProfileTabsMenu tab={tab} username={scout.username} /> : null}
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
        <Stack width='100%'>
          <Stack
            width='fit-content'
            margin='0 auto'
            minWidth={{
              xs: '100%',
              md: 500
            }}
          >
            <PublicScoutProfileStats
              allTimePoints={allTimePoints}
              seasonPoints={seasonPoints}
              buildersScouted={scoutedBuilders.length}
              nftsPurchased={nftsPurchased}
            />
          </Stack>
        </Stack>
        <Typography variant='subtitle1' my={1} color='secondary' fontWeight='500'>
          Scouted Builders
        </Typography>
        {scoutedBuilders.length > 0 ? (
          <BuildersGallery
            builders={scoutedBuilders}
            columns={5}
            size={isDesktop ? 'large' : 'small'}
            userId={userId}
          />
        ) : (
          <Typography>This Scout hasn't discovered any Builders yet. Check back to see who they find!</Typography>
        )}
      </Paper>
    </Box>
  );
}
