import { log } from '@charmverse/core/log';
import { Box, Button, Typography } from '@mui/material';
import { currentSeason } from '@packages/scoutgame/dates';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { getScoutFarcasterBuilderSocialGraph } from '@packages/scoutgame/social/getScoutFarcasterBuilderSocialGraph';
import { baseUrl } from '@packages/utils/constants';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { LoadingGallery } from 'components/common/Loading/LoadingGallery';
import { PageContainer } from 'components/layout/PageContainer';
import { BuildersGalleryContainer } from 'components/scout/components/BuildersGalleryContainer';
import { getBuildersByFid } from 'lib/builders/getBuildersByFid';

async function loadBuilderContent({ fid }: { fid: number }) {
  try {
    const { followers, following } = await getScoutFarcasterBuilderSocialGraph({ fid });

    const { builders: buildersUserFollows } = await getBuildersByFid({
      fids: following,
      limit: 30,
      season: currentSeason
    });

    const { builders: buildersFollowingUser } = await getBuildersByFid({
      fids: followers,
      limit: 30,
      season: currentSeason
    });

    // Remove any builders that appear in both arrays to avoid duplicates
    const uniqueBuildersFollowingUser = buildersFollowingUser.filter(
      (follower) => !buildersUserFollows.some((followedByUser) => followedByUser.id === follower.id)
    );

    // Temporarily duplicate the first builder 4 times if available
    if (buildersFollowingUser.length > 0) {
      const firstBuilder = buildersFollowingUser[0];
      buildersFollowingUser.push(firstBuilder, firstBuilder, firstBuilder);
    }

    // TEST DATA
    return {
      buildersUserFollows: Array.from({ length: 4 }, () => buildersUserFollows[0]),
      buildersFollowingUser: Array.from({ length: 4 }, () => buildersUserFollows[0])
    };

    // Real return value
    return {
      buildersFollowingUser: uniqueBuildersFollowingUser,
      buildersUserFollows
    };
  } catch (error) {
    log.error('Error loading builders you know content', { error, fid });
    return null;
  }
}

export async function BuildersYouKnowPage() {
  const user = await getUserFromSession();

  const redirectUrl = `${(baseUrl as string) ?? 'https://scoutgame.xyz'}/home`;

  if (!user?.farcasterId) {
    redirect(redirectUrl);
  }

  const data = await loadBuilderContent({ fid: user.farcasterId });

  if (!data || (data.buildersFollowingUser.length === 0 && data.buildersUserFollows.length === 0)) {
    redirect((baseUrl as string) ?? 'https://scoutgame.xyz');
  }

  return (
    <PageContainer>
      <Typography variant='h5' color='secondary' mb={2} textAlign='center'>
        Builders You Know
      </Typography>
      <Typography mb={2} textAlign='center'>
        We found some builders you might know based on your Farcaster network
      </Typography>
      <Box display='flex' flexDirection='column' mb={4}>
        <Button variant='contained' LinkComponent={Link} href='/home' sx={{ margin: 'auto', px: 2 }}>
          See all builders
        </Button>
      </Box>
      <Suspense fallback={<LoadingGallery />}>
        <BuildersGalleryContainer
          sort='top'
          initialCursor={null}
          initialBuilders={[...data.buildersUserFollows, ...data.buildersFollowingUser]}
          showHotIcon={false}
        />
      </Suspense>
    </PageContainer>
  );
}
