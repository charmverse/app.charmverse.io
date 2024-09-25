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
  buildersScouted: number;
  nftsPurchased: number;
  scoutedBuilders: BuilderInfo[];
  tab: string;
};

export function PublicScoutProfileContainer(props: ScoutProfileProps) {
  const isDesktop = useMdScreen();
  return (
    <Box>
      {!isDesktop ? <PublicProfileTabsMenu tab={props.tab} username={props.scout.username} /> : null}
      <Paper sx={{ py: 2, my: { xs: 1, md: 2 } }}>
        <Stack flexDirection='row'>
          <BackButton />
          <Box width='calc(100% - 50px)'>
            <UserProfile
              user={{
                ...props.scout,
                githubLogin: props.scout.githubLogin
              }}
            />
          </Box>
        </Stack>
      </Paper>
      {isDesktop ? <PublicProfileTabsMenu tab={props.tab} username={props.scout.username} /> : null}
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
              allTimePoints={props.allTimePoints}
              seasonPoints={props.seasonPoints}
              buildersScouted={props.buildersScouted}
              nftsPurchased={props.nftsPurchased}
            />
          </Stack>
        </Stack>
        <Typography variant='subtitle1' my={1} color='secondary' fontWeight='500'>
          Scouted Builders
        </Typography>
        <BuildersGallery builders={props.scoutedBuilders} />
      </Paper>
    </Box>
  );
}
