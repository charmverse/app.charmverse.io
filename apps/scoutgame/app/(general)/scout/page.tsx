import { ScoutPage } from 'components/scout/ScoutPage';

export default async function Scout({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const sort = searchParams.sort as string;

  return <ScoutPage sort={sort || 'top'} />;
}
