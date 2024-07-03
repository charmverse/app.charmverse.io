import { ProjectDetailsPage } from '@connect/components/projects/[path]/ProjectDetailsPage';

export const dynamic = 'force-dynamic';

export default function ProjectPage({ params }: { params: { path: string } }) {
  return <ProjectDetailsPage path={params.path} />;
}
