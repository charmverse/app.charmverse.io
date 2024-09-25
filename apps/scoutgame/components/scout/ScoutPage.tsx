import 'server-only';

import { Box } from '@mui/material';

import { BuildersGallery } from 'components/common/Gallery/BuildersGallery';
import type { BuildersSort } from 'lib/builders/getSortedBuilders';
import { getSortedBuilders } from 'lib/builders/getSortedBuilders';

import { SearchBuildersInput } from './components/SearchBuildersInput';
import { SortOptionTabs, sortOptions } from './components/SortOptionTabs';

export async function ScoutPage({ sort, user }: { sort: string; user?: { username: string } | null }) {
  const currentSort = sortOptions.some((t) => t.value === sort) ? sort : 'top';
  const builders = await getSortedBuilders({ sort: currentSort as BuildersSort, limit: 10 });
  return (
    <Box p={1}>
      <SearchBuildersInput />
      <SortOptionTabs value={currentSort} />
      <BuildersGallery builders={builders} user={user} />
    </Box>
  );
}
