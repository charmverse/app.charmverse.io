'use client';

import { Box, Paper, Stack, styled, Typography } from '@mui/material';

import { BackButton } from 'components/common/Button/BackButton';
import { BuilderCard } from 'components/common/Card/BuilderCard/BuilderCard';
import type { ScoutInfo } from 'components/common/Card/ScoutCard';
import { ScoutsGallery } from 'components/common/Gallery/ScoutsGallery';
import { UserProfile } from 'components/common/Profile/UserProfile';
import { BuilderActivitiesList } from 'components/profile/components/BuilderProfile/BuilderActivitiesList';
import { BuilderWeeklyStats } from 'components/profile/components/BuilderProfile/BuilderWeeklyStats';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { BuilderActivity } from 'lib/builders/getBuilderActivities';
import type { BasicUserInfo } from 'lib/users/interfaces';

import { PublicProfileTabsMenu } from '../../PublicProfileTabsMenu';

import { PublicBuilderStats } from './PublicBuilderStats';

export type BuilderProfileProps = {
  tab: string;
  builder: BasicUserInfo & {
    price?: bigint;
  };
  allTimePoints?: number;
  seasonPoints?: number;
  totalScouts?: number;
  scouts: ScoutInfo[];
  totalNftsSold?: number;
  builderActivities: BuilderActivity[];
  gemsCollected?: number;
  rank?: number | null;
  user?: {
    username: string;
  } | null;
};

const PaperContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  flex: 1,
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.dark
  },
  [theme.breakpoints.down('md')]: {
    padding: 0,
    backgroundColor: 'transparent'
  }
}));

export function PublicBuilderProfileContainer({
  tab,
  builder,
  allTimePoints,
  seasonPoints,
  totalScouts,
  scouts,
  totalNftsSold,
  builderActivities,
  gemsCollected,
  rank,
  user
}: BuilderProfileProps) {
  const isDesktop = useMdScreen();

  return (
    <Box>
      {!isDesktop ? <PublicProfileTabsMenu tab={tab} username={builder.username} /> : null}
      <Stack
        gap={2}
        my={{
          xs: 1,
          md: 2
        }}
      >
        <Paper sx={{ py: 2 }}>
          <Stack flexDirection='row'>
            <BackButton />
            {isDesktop ? (
              <Box>
                <UserProfile
                  user={{
                    ...builder,
                    githubLogin: builder.githubLogin
                  }}
                />
              </Box>
            ) : (
              <Stack flexDirection='row' alignItems='center' gap={2}>
                <Box width={{ xs: 145, md: 150 }}>
                  <BuilderCard
                    user={user}
                    builder={{
                      ...builder,
                      price: builder.price
                    }}
                    hideDetails
                    showPurchaseButton
                  />
                </Box>
                <Stack gap={1} pr={1}>
                  <UserProfile
                    user={{
                      ...builder,
                      avatar: null,
                      githubLogin: builder.githubLogin
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

        {builder.builder ? (
          <Stack
            gap={2}
            flexDirection={{
              xs: 'column-reverse',
              md: 'row'
            }}
          >
            <PaperContainer>
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
                          ...builder,
                          price: builder.price
                        }}
                        hideDetails
                        showPurchaseButton
                        user={user}
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
              </Stack>
              <Stack gap={1}>
                <Typography color='secondary'>Scouted By</Typography>
                {scouts.length > 0 ? <ScoutsGallery scouts={scouts} /> : <Typography>No scouts yet</Typography>}
              </Stack>
            </PaperContainer>
            <PaperContainer>
              <Stack gap={1}>
                <Typography color='secondary'>This Week</Typography>
                <BuilderWeeklyStats gemsCollected={gemsCollected} rank={rank} />
              </Stack>
              <Stack gap={1}>
                <Typography color='secondary'>Recent Activity</Typography>
                <BuilderActivitiesList activities={builderActivities} />
              </Stack>
            </PaperContainer>
          </Stack>
        ) : (
          <Paper
            sx={{
              p: 4,
              backgroundColor: 'background.dark'
            }}
          >
            <Typography textAlign='center' width='100%' variant='h6'>
              This user does not have a builder profile
            </Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
