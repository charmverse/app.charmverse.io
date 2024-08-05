'use client';

import { WarpcastButton } from '@connect-shared/components/WarpcastButton';
import { useEffect, useState } from 'react';

export function ShareProjectToWarpcastButton({ projectIdOrPath }: { projectIdOrPath: string }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    setUrl(`${window.location.origin}/p/${projectIdOrPath}`);
  }, []);

  return (
    <div data-test='share-project-to-warpcast'>
      <WarpcastButton
        href={encodeURI(
          `https://warpcast.com/~/compose?text=I just registered for the Sunny Awards to be eligible for 540K OP!&embeds[0]=${url}`
        )}
        text='Share'
      />
    </div>
  );
}
