import { notFound } from 'next/navigation';

import { GrantDetailsPage } from 'components/grants/[path]/GrantDetailsPage';
import { getGrant } from 'lib/grants/getGrant';

export default async function GrantPage({
  params
}: {
  params: {
    path: string;
  };
}) {
  const { path } = params;
  const grant = await getGrant({
    path
  });

  if (!grant) {
    return notFound();
  }

  return <GrantDetailsPage grant={grant} />;
}
