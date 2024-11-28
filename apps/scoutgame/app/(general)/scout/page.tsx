import { ScoutPage } from 'components/scout/ScoutPage';

export default async function Scout({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const scoutSort = (searchParams['scout-sort'] as string) || 'points';
  const builderSort = (searchParams['builder-sort'] as string) || 'rank';
  const builderOrder = (searchParams['builder-order'] as string) || 'asc';
  const scoutOrder = (searchParams['scout-order'] as string) || 'desc';
  const scoutTab = (searchParams['scout-tab'] as string) || 'scouts';

  return (
    <ScoutPage
      scoutSort={scoutSort}
      builderSort={builderSort}
      scoutOrder={scoutOrder}
      builderOrder={builderOrder}
      scoutTab={scoutTab}
    />
  );
}
