import { Box, Paper, Stack, Typography } from '@mui/material';

import { BackButton } from 'components/common/Button/BackButton';
import { BuildersGallery } from 'components/common/Gallery/BuildersGallery';
import { UserProfile } from 'components/common/Profile/UserProfile';

import { PublicProfileTabsMenu } from '../PublicProfileTabsMenu';

import type { ScoutProfileProps } from './PublicScoutProfileContainer';
import { PublicScoutProfileStats } from './PublicScoutProfileStats';

export function MobilePublicScoutProfile({
  scout,
  allTimePoints,
  seasonPoints,
  buildersScouted,
  nftsPurchased,
  scoutedBuilders,
  tab
}: ScoutProfileProps) {
  return (
    <Box>
      <PublicProfileTabsMenu tab={tab} username={scout.username} />
      <Paper sx={{ py: 1 }}>
        <Stack flexDirection='row'>
          <BackButton />
          <Box width='calc(100% - 50px)'>
            <UserProfile
              user={{
                id: scout.id,
                displayName: scout.displayName,
                username: scout.username,
                avatar: scout.avatar,
                bio: scout.bio,
                githubLogin: scout.githubLogin
              }}
            />
          </Box>
        </Stack>
      </Paper>
      <Stack my={2}>
        <Stack>
          <PublicScoutProfileStats
            allTimePoints={allTimePoints}
            seasonPoints={seasonPoints}
            buildersScouted={buildersScouted}
            nftsPurchased={nftsPurchased}
          />
          <Typography variant='subtitle1' my={1} color='secondary' fontWeight='500'>
            Scouted Builders
          </Typography>
          <BuildersGallery builders={scoutedBuilders} />
        </Stack>
      </Stack>
    </Box>
  );
}
