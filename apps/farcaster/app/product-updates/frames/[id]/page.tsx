'use server';

import { getProductUpdatesFrame } from 'lib/productUpdates/getProductUpdatesFrame';

export default async function FramesPage({
  params
}: {
  params: {
    id: string;
  };
}) {
  const { nextFrameId, previousFrameId, image } = await getProductUpdatesFrame(params.id);

  if (!previousFrameId && !nextFrameId) {
    return (
      <>
        <meta name='fc:frame' content='vNext' />
        <meta name='og:image' content={image} />
        <meta name='fc:frame:image' content={image} />
      </>
    );
  } else if (!previousFrameId && nextFrameId) {
    return (
      <>
        <meta name='fc:frame' content='vNext' />
        <meta name='og:image' content={image} />
        <meta name='fc:frame:image' content={image} />
        <meta name='fc:frame:button:1' content='Next' />
        <meta name='fc:frame:button:1:action' content='link' />
        <meta
          name='fc:frame:button:1:target'
          content={`https://farcaster.charmverse.io/product-updatesframes/${nextFrameId}`}
        />
      </>
    );
  } else if (previousFrameId && !nextFrameId) {
    return (
      <>
        <meta name='fc:frame' content='vNext' />
        <meta name='og:image' content={image} />
        <meta name='fc:frame:image' content={image} />
        <meta name='fc:frame:button:1' content='Previous' />
        <meta name='fc:frame:button:1:action' content='link' />
        <meta
          name='fc:frame:button:1:target'
          content={`https://farcaster.charmverse.io/product-updates/frames/${previousFrameId}`}
        />
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
        content={`https://farcaster.charmverse.io/product-updates/frames/${previousFrameId}`}
      />
      <meta name='fc:frame:button:2' content='Next' />
      <meta name='fc:frame:button:2:action' content='link' />
      <meta
        name='fc:frame:button:2:target'
        content={`https://farcaster.charmverse.io/product-updates/frames/${nextFrameId}`}
      />
    </>
  );
}
