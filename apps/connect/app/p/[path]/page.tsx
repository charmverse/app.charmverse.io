import { findProject } from '@connect-shared/lib/projects/findProject';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProjectDetailsPage } from 'components/projects/[id]/ProjectDetailsPage';

export const metadata: Metadata = {
  title: 'Project'
};

export default async function ProjectPage({ params }: { params: { path: string } }) {
  const project = await findProject({
    path: params.path
  });

  if (!project) {
    return notFound();
  }

  return (
    <>
      {project.farcasterFrameImage && (
        <>
          {/* Custom meta tags for farcaster */}
          <meta name='fc:frame' content='vNext' />
          <meta name='og:image' content={project.farcasterFrameImage} />
          <meta name='fc:frame:image' content={project.farcasterFrameImage} />
          {/* Button 1 */}
          <meta name='fc:frame:button:1' content='Charm Connect' />
          <meta name='fc:frame:button:1:action' content='link' />
          <meta name='fc:frame:button:1:target' content='https://connect.charmverse.io' />
          {/* Button 2 */}
          <meta name='fc:frame:button:2' content='View' />
          <meta name='fc:frame:button:2:action' content='link' />
          <meta name='fc:frame:button:2:target' content={`https://connect.charmverse.io/p/${params.path}`} />
        </>
      )}
      <ProjectDetailsPage project={project} />
    </>
  );
}
