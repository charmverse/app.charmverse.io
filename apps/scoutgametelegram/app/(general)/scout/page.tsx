import { ScoutPage } from 'components/scout/ScoutPage';

export default async function Scout({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = searchParams.tab as string;
  return <ScoutPage tab={tab || 'builders'} />;
}
