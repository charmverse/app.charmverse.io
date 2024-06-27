import { PageWrapper } from '@connect/components/common/PageWrapper';
import { ProjectDetails } from '@connect/components/projects/ProjectDetails';
import { Suspense } from 'react';

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<PageWrapper>Loading...</PageWrapper>}>
      <ProjectDetails projectId={params.id} />
    </Suspense>
  );
}
