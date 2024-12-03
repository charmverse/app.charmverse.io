import { ScoutPage } from 'components/scout/ScoutPage';

export default async function Scout({
  searchParams
}: {
  searchParams: {
    tab: string | undefined;
    builderSort: string | undefined;
    scoutSort: string | undefined;
    scoutOrder: string | undefined;
    builderOrder: string | undefined;
  };
}) {
  const tab = searchParams.tab || 'builders';
  const builderSort = searchParams.builderSort || 'rank';
  const scoutSort = searchParams.scoutSort || 'rank';
  const scoutOrder = searchParams.scoutOrder || 'asc';
  const builderOrder = searchParams.builderOrder || 'asc';
  return (
    <ScoutPage
      tab={tab}
      builderSort={builderSort}
      scoutSort={scoutSort}
      scoutOrder={scoutOrder}
      builderOrder={builderOrder}
    />
  );
}
