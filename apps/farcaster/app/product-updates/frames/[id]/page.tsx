'use server';

import { isUUID } from '@packages/utils/strings';
import { baseUrl } from '@packages/config/constants';

import { getProductUpdatesFrame } from 'lib/productUpdates/getProductUpdatesFrame';

export default async function FramesPage({
  params
}: {
  params: {
    id: string;
  };
}) {
  const result = isUUID(params.id) ? await getProductUpdatesFrame(params.id) : null;

  if (!result) {
    return <meta name='fc:frame' content='vNext' />;
  }

  const { nextFrameId, previousFrameId, image } = result;

  if (!previousFrameId && !nextFrameId) {
    return (
      <>
        <Image content={image} />
        {/* <meta name='fc:frame:button:1' content='Manage' />
        <meta name='fc:frame:button:1:action' content='post' />
        <meta name='fc:frame:button:1:target' content={`${baseUrl}/api/product-updates/frames/${params.id}/manage`} /> */}
      </>
    );
  } else if (!previousFrameId && nextFrameId) {
    return (
      <>
        <Image content={image} />
        <meta name='fc:frame:button:1' content='Next' />
        <meta name='fc:frame:button:1:action' content='post' />
        <meta name='fc:frame:button:1:target' content={`${baseUrl}/product-updates/frames/${nextFrameId}`} />
        {/* <meta name='fc:frame:button:2' content='Manage' />
        <meta name='fc:frame:button:2:action' content='post' />
        <meta name='fc:frame:button:2:target' content={`${baseUrl}/api/product-updates/frames/${params.id}/manage`} /> */}
      </>
    );
  } else if (previousFrameId && !nextFrameId) {
    return (
      <>
        <Image content={image} />
        <meta name='fc:frame:button:1' content='Previous' />
        <meta name='fc:frame:button:1:action' content='post' />
        <meta name='fc:frame:button:1:target' content={`${baseUrl}/product-updates/frames/${previousFrameId}`} />
        {/* <meta name='fc:frame:button:2' content='Manage' />
        <meta name='fc:frame:button:2:action' content='post' />
        <meta name='fc:frame:button:2:target' content={`${baseUrl}/api/product-updates/frames/${params.id}/manage`} /> */}
      </>
    );
  }

  return (
    <>
      <Image content={image} />
      <meta name='fc:frame:button:1' content='Previous' />
      <meta name='fc:frame:button:1:action' content='post' />
      <meta name='fc:frame:button:1:target' content={`${baseUrl}/product-updates/frames/${previousFrameId}`} />
      {/* <meta name='fc:frame:button:2' content='Manage' />
      <meta name='fc:frame:button:2:action' content='post' />
      <meta name='fc:frame:button:2:target' content={`${baseUrl}/api/product-updates/frames/${params.id}/manage`} /> */}
      <meta name='fc:frame:button:2' content='Next' />
      <meta name='fc:frame:button:2:action' content='post' />
      <meta name='fc:frame:button:2:target' content={`${baseUrl}/product-updates/frames/${nextFrameId}`} />
    </>
  );
}

function Image({ content }: { content: string }) {
  return (
    <>
      <meta name='fc:frame' content='vNext' />
      <meta name='og:image' content={content} />
      <meta name='fc:frame:image' content={content} />
      <meta property='fc:frame:image:aspect_ratio' content='1:1' />
    </>
  );
}
