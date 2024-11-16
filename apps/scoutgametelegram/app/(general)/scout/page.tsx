import { ScoutPage } from 'components/scout/ScoutPage';

export default async function Scout({
  searchParams
}: {
  searchParams: { tab: string | undefined; order: string | undefined; sort: string | undefined };
}) {
  const tab = searchParams.tab || 'builders';
  const sort = searchParams.sort || 'rank';
  // For scouts default to descending rank
  const order = searchParams.order || (tab === 'scouts' ? 'desc' : 'asc');
  return <ScoutPage tab={tab} order={order} sort={sort} />;
}
