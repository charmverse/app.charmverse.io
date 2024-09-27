import { Box } from '@mui/material';
import { Suspense } from 'react';

import { LoadingGallery } from 'components/layout/Loading/LoadingGallery';

import { ScoutPageBuildersGallery } from './components/ScoutPageBuildersGallery';
import { SearchBuildersInput } from './components/SearchBuildersInput';
import { SortOptionTabs, sortOptions } from './components/SortOptionTabs';

export function ScoutPage({ sort, user }: { sort: string; user?: { username: string } | null }) {
  const currentSort = sortOptions.some((t) => t.value === sort) ? sort : 'top';
  return (
    <Box p={1}>
      <SearchBuildersInput />
      <SortOptionTabs value={currentSort} />
      <Suspense fallback={<LoadingGallery />}>
        <ScoutPageBuildersGallery sort={currentSort} user={user} showHotIcon={currentSort === 'hot'} />
      </Suspense>
    </Box>
  );
}
