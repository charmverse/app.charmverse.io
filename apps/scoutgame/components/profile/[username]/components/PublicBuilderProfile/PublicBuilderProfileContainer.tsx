'use client';

import { Box, Paper, Stack, Typography } from '@mui/material';

import { BackButton } from 'components/common/Button/BackButton';
import { BuilderCard } from 'components/common/Card/BuilderCard/BuilderCard';
import type { ScoutInfo } from 'components/common/Card/ScoutCard';
import { ScoutsGallery } from 'components/common/Gallery/ScoutsGallery';
import { UserProfile } from 'components/common/Profile/UserProfile';
import { BuilderActivitiesList } from 'components/profile/components/BuilderActivitiesList';
import { BuilderWeeklyStats } from 'components/profile/mine/BuilderProfile/BuilderWeeklyStats';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { BuilderActivity } from 'lib/builders/getBuilderActivities';
import type { BasicUserInfo } from 'lib/builders/interfaces';

import { PublicProfileTabsMenu } from '../../PublicProfileTabsMenu';

import { PublicBuilderStats } from './PublicBuilderStats';

export type BuilderProfileProps = {
  tab: string;
  builder: BasicUserInfo & {
    price: bigint;
    isBuilder: boolean;
  };
  builderId: string;
  allTimePoints: number;
  seasonPoints: number;
  totalScouts: number;
  scouts: ScoutInfo[];
  totalNftsSold: number;
  builderActivities: BuilderActivity[];
  gemsCollected?: number;
  rank: number;
};

export function PublicBuilderProfileContainer({
  tab,
  builder,
  builderId,
  allTimePoints,
  seasonPoints,
  totalScouts,
  scouts,
  totalNftsSold,
  builderActivities,
  gemsCollected,
  rank
}: BuilderProfileProps) {
  const isDesktop = useMdScreen();

  return (
    <>
      {!isDesktop ? <PublicProfileTabsMenu tab={tab} username={builder.username} /> : null}
      {builder.isBuilder ? (
        <Stack
          gap={2}
          mt={{
            xs: 0,
            md: 4
          }}
        >
          <Paper sx={{ py: 2, pr: { xs: 1, md: 2 } }}>
            <Stack flexDirection='row'>
              <BackButton />
              {isDesktop ? (
                <Box width='calc(100% - 50px)'>
                  <UserProfile
                    user={{
                      id: builderId,
                      displayName: builder.displayName,
                      username: builder.username,
                      avatar: builder.avatar,
                      bio: builder.bio,
                      githubLogin: builder.githubLogin
                    }}
                  />
                </Box>
              ) : (
                <Stack flexDirection='row' alignItems='center' gap={2}>
                  <Box width={{ xs: 145, md: 150 }}>
                    <BuilderCard
                      builder={{
                        id: builderId,
                        avatar: builder.avatar,
                        username: builder.username,
                        displayName: builder.displayName,
                        price: builder.price
                      }}
                      hideDetails
                      showPurchaseButton
                    />
                  </Box>
                  <Stack width='calc(100% - 150px)' gap={1}>
                    <UserProfile
                      user={{
                        username: builder.username,
                        displayName: builder.displayName,
                        id: builderId,
                        githubLogin: builder.githubLogin,
                        bio: builder.bio
                      }}
                    />
                    <PublicBuilderStats
                      allTimePoints={allTimePoints}
                      seasonPoints={seasonPoints}
                      totalScouts={totalScouts}
                      totalNftsSold={totalNftsSold}
                    />
                  </Stack>
                </Stack>
              )}
            </Stack>
          </Paper>
          {isDesktop ? <PublicProfileTabsMenu tab={tab} username={builder.username} /> : null}
          <Paper
            sx={{
              p: {
                xs: 0,
                md: 2
              },
              backgroundColor: {
                xs: 'transparent',
                md: 'background.dark'
              }
            }}
          >
            <Stack
              gap={4}
              flexDirection={{
                xs: 'column-reverse',
                md: 'row'
              }}
            >
              <Stack gap={2} flex={1}>
                {isDesktop ? (
                  <Paper
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      p: 4,
                      justifyContent: 'center'
                    }}
                  >
                    <Box width={{ md: 150 }}>
                      <BuilderCard
                        builder={{
                          id: builderId,
                          avatar: builder.avatar,
                          username: builder.username,
                          displayName: builder.displayName,
                          price: builder.price
                        }}
                        hideDetails
                        showPurchaseButton
                      />
                    </Box>
                    <PublicBuilderStats
                      seasonPoints={seasonPoints}
                      allTimePoints={allTimePoints}
                      totalScouts={totalScouts}
                      totalNftsSold={totalNftsSold}
                    />
                  </Paper>
                ) : null}
                <Stack gap={0.5}>
                  <Typography color='secondary'>Scouted By</Typography>
                  <ScoutsGallery scouts={scouts} />
                </Stack>
              </Stack>
              <Stack gap={2} flex={1}>
                <Stack>
                  <Typography color='secondary'>This Week</Typography>
                  <BuilderWeeklyStats gemsCollected={gemsCollected} rank={rank} />
                </Stack>
                <Stack>
                  <Typography color='secondary'>Recent Activity</Typography>
                  <BuilderActivitiesList activities={builderActivities} />
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      ) : (
        <Paper
          sx={{
            p: 4,
            background: (theme) => theme.palette.background.dark
          }}
        >
          <Typography textAlign='center' width='100%' variant='h6'>
            This user does not have a builder profile
          </Typography>
        </Paper>
      )}
    </>
  );
}
