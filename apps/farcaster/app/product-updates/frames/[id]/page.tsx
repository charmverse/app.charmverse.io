'use server';

import { baseUrl } from '@root/config/constants';

import { getProductUpdatesFrame } from 'lib/productUpdates/getProductUpdatesFrame';

export default async function FramesPage({
  params
}: {
  params: {
    id: string;
  };
}) {
  const result = await getProductUpdatesFrame(params.id);

  if (!result) {
    return <meta name='fc:frame' content='vNext' />;
  }

  const { nextFrameId, previousFrameId, image } = result;

  if (!previousFrameId && !nextFrameId) {
    return (
      <>
        <meta name='fc:frame' content='vNext' />
        <meta name='og:image' content={image} />
        <meta name='fc:frame:image' content={image} />
        <meta name='fc:frame:button:1' content='Manage' />
        <meta name='fc:frame:button:1:action' content='post' />
        <meta name='fc:frame:button:1:target' content={`${baseUrl}/product-updates/frames/${params.id}/manage`} />
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
        <meta name='fc:frame:button:1:target' content={`${baseUrl}/product-updates/frames/${nextFrameId}`} />
        <meta name='fc:frame:button:2' content='Manage' />
        <meta name='fc:frame:button:2:action' content='post' />
        <meta name='fc:frame:button:2:target' content={`${baseUrl}/product-updates/frames/${params.id}/manage`} />
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
        <meta name='fc:frame:button:1:target' content={`${baseUrl}/product-updates/frames/${previousFrameId}`} />
        <meta name='fc:frame:button:2' content='Manage' />
        <meta name='fc:frame:button:2:action' content='post' />
        <meta name='fc:frame:button:2:target' content={`${baseUrl}/product-updates/frames/${params.id}/manage`} />
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
      <meta name='fc:frame:button:1:target' content={`${baseUrl}/product-updates/frames/${previousFrameId}`} />
      <meta name='fc:frame:button:2' content='Manage' />
      <meta name='fc:frame:button:2:action' content='post' />
      <meta name='fc:frame:button:2:target' content={`${baseUrl}/product-updates/frames/${params.id}/manage`} />
      <meta name='fc:frame:button:3' content='Next' />
      <meta name='fc:frame:button:3:action' content='post' />
      <meta name='fc:frame:button:3:target' content={`${baseUrl}/product-updates/frames/${nextFrameId}`} />
    </>
  );
}