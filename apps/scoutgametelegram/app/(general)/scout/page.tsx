import { ScoutPage } from 'components/scout/ScoutPage';

export default async function Scout({ searchParams }: { searchParams: { tab: string; order: string; sort: string } }) {
  const tab = searchParams.tab as string;
  const sort = searchParams.sort || 'rank';
  // For scouts default to descending rank
  const order = searchParams.order || (tab === 'scouts' ? 'desc' : 'asc');
  return <ScoutPage tab={tab || 'builders'} order={order} sort={sort} />;
}
