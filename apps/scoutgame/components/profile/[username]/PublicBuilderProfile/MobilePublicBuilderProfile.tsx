import { Box, Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { BackButton } from 'components/common/Button/BackButton';
import { BuilderCard } from 'components/common/Card/BuilderCard/BuilderCard';
import { ScoutsGallery } from 'components/common/Gallery/ScoutsGallery';
import { UserProfile } from 'components/common/Profile/UserProfile';
import { BuilderActivitiesList } from 'components/profile/components/BuilderActivitiesList';
import { BuilderWeeklyStats } from 'components/profile/mine/BuilderProfile/BuilderWeeklyStats';

import { PublicProfileTabsMenu } from '../PublicProfileTabsMenu';

import type { BuilderProfileProps } from './PublicBuilderProfileContainer';

export function MobilePublicBuilderProfile({
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
    <>
      <PublicProfileTabsMenu tab={tab} username={builder.username} />
      {builder.isBuilder ? (
        <Stack gap={2}>
          <Paper sx={{ py: 2, pr: { xs: 1, md: 2 } }}>
            <Stack flexDirection='row'>
              <BackButton />
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
                  <Stack gap={0.5}>
                    <Typography fontWeight={500} color='secondary' variant='subtitle1'>
                      THIS SEASON (ALL TIME)
                    </Typography>
                    <Stack flexDirection='row' gap={1} alignItems='center'>
                      <Typography fontWeight={500} variant='h5' color='green.main'>
                        {seasonPoints}
                      </Typography>
                      <Image
                        src='/images/profile/scout-game-green-icon.svg'
                        width='25'
                        height='25'
                        alt='scout game icon'
                      />
                      <Typography fontWeight={500} variant='h6' color='green.main'>
                        ({allTimePoints})
                      </Typography>
                    </Stack>
                    <Typography fontWeight={500} variant='h5' color='green.main'>
                      {totalScouts} Scouts
                    </Typography>
                    <Stack flexDirection='row' gap={1} alignItems='center'>
                      <Typography fontWeight={500} variant='h5' color='green.main'>
                        {totalNftsSold}
                      </Typography>
                      <Image src='/images/profile/icons/nft-green-icon.svg' width='25' height='25' alt='nft icon' />
                      <Typography fontWeight={500} variant='h5' color='green.main'>
                        Sold
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </Paper>
          <Stack>
            <Typography color='secondary'>This Week</Typography>
            <BuilderWeeklyStats gemsCollected={gemsCollected} rank={rank} />
          </Stack>
          <Stack>
            <Typography color='secondary'>Recent Activity</Typography>
            <BuilderActivitiesList activities={builderActivities} />
          </Stack>
          <Stack gap={0.5}>
            <Typography color='secondary'>Scouted By</Typography>
            <ScoutsGallery scouts={scouts} />
          </Stack>
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
