import { BuilderSearchPage } from 'components/scout/BuilderSearchPage';

export default async function Scout({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const sort = searchParams.sort as string;

  return <BuilderSearchPage sort={sort || 'top'} />;
}
