import { Box, Button, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import Link from 'next/link';
import { Suspense } from 'react';

import { LoadingGallery } from 'components/common/Loading/LoadingGallery';
import { PageContainer } from 'components/layout/PageContainer';
import { BuildersGalleryContainer } from 'components/scout/components/BuildersGalleryContainer';

export function BuildersYouKnowPage({ builders }: { builders: BuilderInfo[] }) {
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
        <BuildersGalleryContainer sort='top' initialCursor={null} initialBuilders={builders} showHotIcon={false} />
      </Suspense>
    </PageContainer>
  );
}
