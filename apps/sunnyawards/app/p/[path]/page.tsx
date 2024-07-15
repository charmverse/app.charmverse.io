import { fetchProject } from '@connect-shared/lib/projects/fetchProject';
import { notFound } from 'next/navigation';

import { ProjectDetailsPage } from 'components/projects/[id]/ProjectDetailsPage';

export default async function ProjectPage({ params }: { params: { path: string } }) {
  const project = await fetchProject({
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
          <meta name='fc:frame' content='Next' />
          <meta name='og:image' content={project.farcasterFrameImage} />
          <meta name='fc:frame:image' content={project.farcasterFrameImage} />
          {/* Button 1 */}
          <meta name='fc:frame:button:1' content='Sunny Awards' />
          <meta name='fc:frame:button:1:action' content='link' />
          <meta name='fc:frame:button:1:target' content='https://thesunnyawards.fun' />
          {/* Button 2 */}
          <meta name='fc:frame:button:2' content='View' />
          <meta name='fc:frame:button:2:action' content='link' />
          <meta name='fc:frame:button:2:target' content={`https://register.thesunnyawards.fun/p/${params.path}`} />
        </>
      )}
      <ProjectDetailsPage project={project} />
    </>
  );
}
