import { ProjectDetailsPage } from '@connect/components/projects/[id]/ProjectDetailsPage';
import { ProjectDetailsSkeleton } from '@connect/components/projects/components/ProjectDetailsSkeleton';
import { Suspense } from 'react';

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<ProjectDetailsSkeleton />}>
      <ProjectDetailsPage projectId={params.id} />
    </Suspense>
  );
}
