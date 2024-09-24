import 'server-only';

import type { BuildersSort } from 'lib/builders/getSortedBuilders';
import { getSortedBuilders } from 'lib/builders/getSortedBuilders';

import { BuildersGrid } from './BuildersGrid';

export async function BuildersGridContainer({ sort }: { sort: BuildersSort }) {
  const builders = await getSortedBuilders({ sort, limit: 10 });
  return <BuildersGrid users={builders} />;
}
