import { Box, Button, Typography } from '@mui/material';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { loadBuildersUserKnows } from '@packages/scoutgame/social/loadBuildersUserKnows';
import { baseUrl } from '@packages/utils/constants';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { LoadingGallery } from 'components/common/Loading/LoadingGallery';
import { PageContainer } from 'components/layout/PageContainer';
import { BuildersGalleryContainer } from 'components/scout/components/BuildersGalleryContainer';

export async function BuildersYouKnowPage() {
  const user = await getUserFromSession();

  const redirectUrl = `${(baseUrl as string) ?? 'https://scoutgame.xyz'}/home`;

  if (!user?.farcasterId) {
    redirect(redirectUrl);
  }

  const data = await loadBuildersUserKnows({ fid: user.farcasterId });

  if (!data || (data.buildersFollowingUser.length === 0 && data.buildersUserFollows.length === 0)) {
    redirect((baseUrl as string) ?? 'https://scoutgame.xyz');
  }

  return (
    <PageContainer>
      <Typography variant='h5' color='secondary' mb={2} textAlign='center'>
        Builders You Know
      </Typography>
      <Typography mb={2} textAlign='center'>
        We found some Builders you might know
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
