import { ScoutPage } from 'components/scout/ScoutPage';

export default async function Scout({ searchParams }: { searchParams: { tab: string; order: string; sort: string } }) {
  const tab = searchParams.tab as string;
  const order = searchParams.order || 'asc';
  const sort = searchParams.sort || 'rank';
  return <ScoutPage tab={tab || 'builders'} order={order} sort={sort} />;
}
