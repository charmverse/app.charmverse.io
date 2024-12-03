import { ScoutPage } from 'components/scout/ScoutPage';

export default async function Scout({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const scoutSort = (searchParams.scoutSort as string) || 'points';
  const builderSort = (searchParams.builderSort as string) || 'rank';
  const builderOrder = (searchParams.builderOrder as string) || 'asc';
  const scoutOrder = (searchParams.scoutOrder as string) || 'desc';
  const scoutTab = (searchParams.scoutTab as string) || 'scouts';
  const buildersLayout = (searchParams.buildersLayout as string) || 'table';
  const tab = (searchParams.tab as string) || 'scouts';

  return (
    <ScoutPage
      scoutSort={scoutSort}
      builderSort={builderSort}
      scoutOrder={scoutOrder}
      builderOrder={builderOrder}
      scoutTab={scoutTab}
      buildersLayout={buildersLayout}
      tab={tab}
    />
  );
}
