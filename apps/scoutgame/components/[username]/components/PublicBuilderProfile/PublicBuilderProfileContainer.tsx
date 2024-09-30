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

import { PublicBuilderStats } from './PublicBuilderStats';

type BuilderProfileProps = {
  builder: BasicUserInfo & {
    price?: bigint;
    nftImageUrl?: string;
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
    id: string;
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
      <Stack
        gap={2}
        mb={{
          xs: 1,
          md: 2
        }}
      >
        {!isDesktop ? (
          <Paper sx={{ py: 2 }}>
            <Stack flexDirection='row'>
              <BackButton />
              <Stack flexDirection='row' alignItems='center' gap={2}>
                <Box minWidth='fit-content'>
                  <BuilderCard
                    builder={{
                      ...builder,
                      price: builder.price ?? BigInt(0),
                      nftsSold: 0,
                      gemsCollected: 0,
                      builderPoints: 0
                    }}
                    hideDetails
                    showPurchaseButton
                    size='small'
                    userId={user?.id}
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
            </Stack>
          </Paper>
        ) : null}

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
                  <BuilderCard
                    builder={{
                      ...builder,
                      price: builder.price ?? BigInt(0),
                      nftsSold: 0,
                      gemsCollected: 0,
                      builderPoints: 0
                    }}
                    userId={user?.id}
                    hideDetails
                    showPurchaseButton
                  />
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
              {scouts.length > 0 ? (
                <ScoutsGallery scouts={scouts} />
              ) : (
                <Typography>
                  No Scouts have discovered this Builder yet. Be the first to support their journey!
                </Typography>
              )}
            </Stack>
          </PaperContainer>
          <PaperContainer>
            <Stack gap={1}>
              <Typography color='secondary'>This Week</Typography>
              <BuilderWeeklyStats gemsCollected={gemsCollected} rank={rank} />
            </Stack>
            <Stack gap={1}>
              <Typography color='secondary'>Recent Activity</Typography>
              {builderActivities.length > 0 ? (
                <BuilderActivitiesList activities={builderActivities} />
              ) : (
                <Typography>No recent activity by this builder.</Typography>
              )}
            </Stack>
          </PaperContainer>
        </Stack>
      </Stack>
    </Box>
  );
}
