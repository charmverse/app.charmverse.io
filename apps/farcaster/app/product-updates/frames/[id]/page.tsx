'use server';

import { baseUrl } from '@root/config/constants';

import { getProductUpdatesFrame } from 'lib/product-updates/getFrame';

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
        <meta name='fc:frame:button:1:action' content='post' />
        <meta name='fc:frame:button:1:target' content={`${baseUrl}/api/product-updates/frames/${nextFrameId}`} />
      </>
    );
  } else if (previousFrameId && !nextFrameId) {
    return (
      <>
        <meta name='fc:frame' content='vNext' />
        <meta name='og:image' content={image} />
        <meta name='fc:frame:image' content={image} />
        <meta name='fc:frame:button:1' content='Previous' />
        <meta name='fc:frame:button:1:action' content='post' />
        <meta name='fc:frame:button:1:target' content={`${baseUrl}/api/product-updates/frames/${previousFrameId}`} />
      </>
    );
  }

  return (
    <>
      <meta name='fc:frame' content='vNext' />
      <meta name='og:image' content={image} />
      <meta name='fc:frame:image' content={image} />
      <meta name='fc:frame:button:1' content='Previous' />
      <meta name='fc:frame:button:1:action' content='post' />
      <meta name='fc:frame:button:1:target' content={`${baseUrl}/api/product-updates/frames/${previousFrameId}`} />
      <meta name='fc:frame:button:2' content='Next' />
      <meta name='fc:frame:button:2:action' content='post' />
      <meta name='fc:frame:button:2:target' content={`${baseUrl}/api/product-updates/frames/${nextFrameId}`} />
    </>
  );
}
