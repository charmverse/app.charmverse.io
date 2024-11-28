import { Box, Stack, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { ScoutBuilderCarousel } from '@packages/scoutgame-ui/components/scout/ScoutBuilderCarousel';
import { Suspense } from 'react';

import { LoadingGallery } from 'components/common/Loading/LoadingGallery';
import type { BuildersSort } from 'lib/builders/getSortedBuilders';

import { PageContainer } from '../layout/PageContainer';

import { ScoutPageBuildersGallery } from './components/ScoutPageBuildersGallery';
import { SearchBuildersInput } from './components/SearchBuildersInput';
import { SortOptionTabs, sortOptions } from './components/SortOptionTabs';

export function ScoutPage({ sort, builders }: { sort: BuildersSort; builders: BuilderInfo[] }) {
  const currentSort = sortOptions.some((t) => t.value === sort) ? sort : 'top';

  return (
    <PageContainer>
      <Stack gap={2} my={2}>
        <Typography variant='h4' color='secondary' fontWeight={600} textAlign='center'>
          Scout your Starter Pack
        </Typography>
        <ScoutBuilderCarousel builders={builders} />
      </Stack>
      <Typography variant='h5' color='secondary' fontWeight={600} textAlign='center' mb={2}>
        Season Scouts
      </Typography>
      <Box position='sticky' top={0} zIndex={1} bgcolor='background.default'>
        <SearchBuildersInput />
        <SortOptionTabs value={currentSort} />
      </Box>
      <Suspense key={currentSort} fallback={<LoadingGallery />}>
        <ScoutPageBuildersGallery sort={currentSort} showHotIcon={currentSort === 'hot'} />
      </Suspense>
    </PageContainer>
  );
}
