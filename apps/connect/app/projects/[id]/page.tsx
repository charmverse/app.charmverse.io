import { ProjectDetailsSkeleton } from '@connect/components/projects/components/ProjectDetailsSkeleton';
import { ProjectDetails } from '@connect/components/projects/ProjectDetails';
import { Suspense } from 'react';

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<ProjectDetailsSkeleton />}>
      <ProjectDetails projectId={params.id} />
    </Suspense>
  );
}
