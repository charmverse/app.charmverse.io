import { BuildersGallery } from 'components/common/Gallery/BuildersGallery';
import type { BuildersSort } from 'lib/builders/getSortedBuilders';
import { getSortedBuilders } from 'lib/builders/getSortedBuilders';

export async function ScoutPageBuildersGallery({ sort, user }: { sort: string; user?: { username: string } | null }) {
  const builders = await getSortedBuilders({ sort: sort as BuildersSort, limit: 10 });

  return <BuildersGallery builders={builders} user={user} />;
}
