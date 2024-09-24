import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';
import { Box } from '@mui/material';

import type { BuildersSort } from 'lib/builders/getSortedBuilders';

import { BuildersGridContainer } from './components/BuildersGridContainer';
import { SearchBuildersInput } from './components/SearchBuildersInput';
import { SortOptionTabs, sortOptions } from './components/SortOptionTabs';

export async function ScoutPage({ user, sort }: { user: Scout | null; sort: string }) {
  const currentSort = sortOptions.some((t) => t.value === sort) ? sort : 'top';

  return (
    <Box p={1}>
      <SearchBuildersInput />
      <SortOptionTabs value={currentSort} />
      <BuildersGridContainer sort={currentSort as BuildersSort} />
    </Box>
  );
}
