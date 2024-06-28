import { ProjectDetailsPage } from '@connect/components/projects/[id]/ProjectDetailsPage';

export const dynamic = 'force-dynamic';

export default function ProjectPage({ params }: { params: { id: string } }) {
  return <ProjectDetailsPage projectId={params.id} />;
}
