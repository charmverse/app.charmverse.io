import { Box, Paper, Stack, Typography } from '@mui/material';

import { BuilderActivitiesList } from 'components/builder/BuilderActivitiesList';
import { BuilderCard } from 'components/builder/Card/BuilderCard';
import { BackButton } from 'components/common/Button/BackButton';
import { UserProfile } from 'components/common/Profile/UserProfile';
import { BuilderWeeklyStats } from 'components/profile/mine/BuilderProfile/BuilderWeeklyStats';
import { ScoutsGallery } from 'components/scout/ScoutsGallery';

import { PublicProfileTabsMenu } from '../PublicProfileTabsMenu';

import type { BuilderProfileProps } from './PublicBuilderProfileContainer';
import { PublicBuilderStats } from './PublicBuilderStats';

export function DesktopPublicBuilderProfile({
  tab,
  builder,
  builderId,
  allTimePoints,
  seasonPoints,
  totalScouts,
  totalNftsSold,
  builderActivities,
  gemsCollected,
  rank,
  scouts
}: BuilderProfileProps) {
  return (
    <Box>
      <Paper sx={{ py: 1, mt: 4, mb: 2 }}>
        <Stack flexDirection='row'>
          <BackButton />
          <Box width='calc(100% - 50px)'>
            <UserProfile
              user={{
                id: builderId,
                displayName: builder.displayName,
                username: builder.username,
                avatar: builder.avatar || '',
                bio: builder.bio,
                githubLogin: builder.githubLogin
              }}
            />
          </Box>
        </Stack>
      </Paper>
      <PublicProfileTabsMenu tab={tab} username={builder.username} />
      <Paper
        sx={{
          gap: 2,
          display: 'flex',
          flexDirection: 'row',
          p: 4,
          background: (theme) => theme.palette.background.dark
        }}
      >
        <Stack gap={2} flexGrow={1}>
          <Paper sx={{ py: 2, pr: { xs: 1, md: 2 } }}>
            <Stack flexDirection='row' alignItems='center' gap={2} p={2} justifyContent='center'>
              <Box width={{ md: 150 }}>
                <BuilderCard
                  builder={{
                    id: builderId,
                    nftAvatar: builder.avatar || '',
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
            </Stack>
          </Paper>
          <Stack gap={0.5}>
            <Typography color='secondary' variant='h6'>
              Scouted By
            </Typography>
            <ScoutsGallery scouts={scouts} />
          </Stack>
        </Stack>
        <Stack flexGrow={1} gap={2}>
          <Stack>
            <Typography color='secondary' variant='h6'>
              This Week
            </Typography>
            <BuilderWeeklyStats gemsCollected={gemsCollected} rank={rank} />
          </Stack>
          <Stack>
            <Typography color='secondary' variant='h6'>
              Recent Activity
            </Typography>
            <BuilderActivitiesList activities={builderActivities} />
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
