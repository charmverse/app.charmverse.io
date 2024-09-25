import { Box, Paper, Stack, Typography } from '@mui/material';

import { BackButton } from 'components/common/Button/BackButton';
import { BuildersGallery } from 'components/common/Gallery/BuildersGallery';
import { UserProfile } from 'components/common/Profile/UserProfile';

import { PublicProfileTabsMenu } from '../PublicProfileTabsMenu';

import type { ScoutProfileProps } from './PublicScoutProfileContainer';
import { PublicScoutProfileStats } from './PublicScoutProfileStats';

export function DesktopPublicScoutProfile({
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
      <Paper sx={{ py: 1, mt: 4, mb: 2 }}>
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
      <PublicProfileTabsMenu tab={tab} username={scout.username} />

      <Paper sx={{ background: (theme) => theme.palette.background.dark, p: 4 }}>
        <Stack alignItems='flex-start'>
          <Stack mb={4} flexDirection='row' justifyContent='center' width='100%'>
            <Box width='fit-content' minWidth='500px'>
              <PublicScoutProfileStats
                allTimePoints={allTimePoints}
                seasonPoints={seasonPoints}
                buildersScouted={buildersScouted}
                nftsPurchased={nftsPurchased}
              />
            </Box>
          </Stack>
          <Typography variant='h5' my={1} textAlign='left' color='secondary' fontWeight='500'>
            Scouted Builders
          </Typography>
          <BuildersGallery builders={scoutedBuilders} />
        </Stack>
      </Paper>
    </Box>
  );
}
