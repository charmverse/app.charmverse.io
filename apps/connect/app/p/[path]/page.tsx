import { ProjectDetailsPage } from '@connect/components/projects/[id]/ProjectDetailsPage';
import { fetchProject } from '@connect/lib/actions/fetchProject';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: { path: string } }) {
  const project = await fetchProject({
    path: params.path
  });

  return (
    <>
      {project?.farcasterFrameImage && (
        <>
          {/* Custom meta tags for farcaster */}
          <meta property='fc:frame' content='vNext' />
          <meta property='og:image' content={project.farcasterFrameImage} />
          <meta name='fc:frame:image' content={project.farcasterFrameImage} />
          {/* Button 1 */}
          <meta name='fc:frame:button:1' content='Create a project' />
          <meta name='fc:frame:button:1:action' content='link' />
          <meta name='fc:frame:button:1:target' content='https://connect.charmverse.io' />
          {/* Button 2 */}
          <meta name='fc:frame:button:2' content='Onchain Summer Projects' />
          <meta name='fc:frame:button:2:action' content='link' />
          <meta name='fc:frame:button:2:target' content='https://connect.charmverse.io' />
          {/* Button 3 */}
          <meta name='fc:frame:button:3' content='View' />
          <meta name='fc:frame:button:3:action' content='link' />
          <meta name='fc:frame:button:3:target' content={`https://connect.charmverse.io/p/${params.id}`} />
        </>
      )}
      <ProjectDetailsPage project={project} />;
    </>
  );
}
