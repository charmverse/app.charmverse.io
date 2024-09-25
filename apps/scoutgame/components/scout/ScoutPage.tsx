import { Box } from '@mui/material';

import { ScoutPageBuildersGallery } from './components/ScoutPageBuildersGallery';
import { SearchBuildersInput } from './components/SearchBuildersInput';
import { SortOptionTabs, sortOptions } from './components/SortOptionTabs';

export function ScoutPage({ sort, user }: { sort: string; user?: { username: string } | null }) {
  const currentSort = sortOptions.some((t) => t.value === sort) ? sort : 'top';
  return (
    <Box p={1}>
      <SearchBuildersInput />
      <SortOptionTabs value={currentSort} />
      <ScoutPageBuildersGallery sort={currentSort} user={user} />
    </Box>
  );
}
