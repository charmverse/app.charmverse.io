import { GrantDetailsPage } from '@connect/components/grants/[path]/GrantDetailsPage';
import { getGrant } from '@connect/lib/grants/getGrant';
import { notFound } from 'next/navigation';

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
