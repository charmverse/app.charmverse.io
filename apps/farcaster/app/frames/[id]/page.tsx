'use server';

import { getComposerActionFrame } from 'lib/getComposerActionFrame';

export default async function FramesPage({
  params
}: {
  params: {
    id: string;
  };
}) {
  const { nextComposerActionFrameId, previousComposerActionFrameId, image, project } = await getComposerActionFrame(
    params.id
  );

  if (!previousComposerActionFrameId && !nextComposerActionFrameId) {
    return (
      <>
        <meta name='fc:frame' content='vNext' />
        <meta name='og:image' content={image} />
        <meta name='fc:frame:image' content={image} />
        <meta name='fc:frame:button:1' content='View project' />
        <meta name='fc:frame:button:1:action' content='link' />
        <meta name='fc:frame:button:1:target' content={`https://connect.charmverse.io/p/${project.path}`} />
      </>
    );
  } else if (!previousComposerActionFrameId && nextComposerActionFrameId) {
    return (
      <>
        <meta name='fc:frame' content='vNext' />
        <meta name='og:image' content={image} />
        <meta name='fc:frame:image' content={image} />
        <meta name='fc:frame:button:1' content='View project' />
        <meta name='fc:frame:button:1:action' content='link' />
        <meta name='fc:frame:button:1:target' content={`https://connect.charmverse.io/p/${project.path}`} />
        <meta name='fc:frame:button:2' content='Next' />
        <meta name='fc:frame:button:2:action' content='link' />
        <meta
          name='fc:frame:button:2:target'
          content={`https://connect.charmverse.io/frames/${nextComposerActionFrameId}`}
        />
      </>
    );
  } else if (previousComposerActionFrameId && !nextComposerActionFrameId) {
    return (
      <>
        <meta name='fc:frame' content='vNext' />
        <meta name='og:image' content={image} />
        <meta name='fc:frame:image' content={image} />
        <meta name='fc:frame:button:1' content='Previous' />
        <meta name='fc:frame:button:1:action' content='link' />
        <meta
          name='fc:frame:button:1:target'
          content={`https://connect.charmverse.io/frames/${previousComposerActionFrameId}`}
        />
        <meta name='fc:frame:button:2' content='View project' />
        <meta name='fc:frame:button:2:action' content='link' />
        <meta name='fc:frame:button:2:target' content={`https://connect.charmverse.io/p/${project.path}`} />
      </>
    );
  }

  return (
    <>
      <meta name='fc:frame' content='vNext' />
      <meta name='og:image' content={image} />
      <meta name='fc:frame:image' content={image} />
      <meta name='fc:frame:button:1' content='Previous' />
      <meta name='fc:frame:button:1:action' content='link' />
      <meta
        name='fc:frame:button:1:target'
        content={`https://connect.charmverse.io/frames/${previousComposerActionFrameId}`}
      />
      <meta name='fc:frame:button:2' content='View project' />
      <meta name='fc:frame:button:2:action' content='link' />
      <meta name='fc:frame:button:2:target' content={`https://connect.charmverse.io/p/${project.path}`} />
      <meta name='fc:frame:button:3' content='Next' />
      <meta name='fc:frame:button:3:action' content='link' />
      <meta
        name='fc:frame:button:3:target'
        content={`https://connect.charmverse.io/frames/${nextComposerActionFrameId}`}
      />
    </>
  );
}
