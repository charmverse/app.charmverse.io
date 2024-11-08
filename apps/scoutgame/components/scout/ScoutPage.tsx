import { Box } from '@mui/material';
import { Suspense } from 'react';

import { LoadingGallery } from 'components/common/Loading/LoadingGallery';
import type { BuildersSort } from 'lib/builders/getSortedBuilders';

import { PageContainer } from '../layout/PageContainer';

import { ScoutPageBuildersGallery } from './components/ScoutPageBuildersGallery';
import { SearchBuildersInput } from './components/SearchBuildersInput';
import { SortOptionTabs, sortOptions } from './components/SortOptionTabs';

export function ScoutPage({ sort }: { sort: BuildersSort }) {
  const currentSort = sortOptions.some((t) => t.value === sort) ? sort : 'top';

  return (
    <PageContainer>
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
