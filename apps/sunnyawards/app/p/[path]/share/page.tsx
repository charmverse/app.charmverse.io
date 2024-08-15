import { ShareProjectPage } from 'components/projects/[id]/share/ShareProjectPage';

export default async function PublishProjectPage({ params }: { params: { path: string } }) {
  return <ShareProjectPage path={params.path} />;
}
