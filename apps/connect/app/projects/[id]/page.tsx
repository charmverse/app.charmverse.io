import { ProjectDetailsPage } from '@connect/components/projects/[id]/ProjectDetailsPage';

export default function ProjectPage({ params }: { params: { id: string } }) {
  return <ProjectDetailsPage projectId={params.id} />;
}
