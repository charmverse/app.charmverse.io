'use client';

import { WarpcastButton } from '@connect-shared/components/WarpcastButton';
import ShareIcon from '@mui/icons-material/Share';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function ShareProjectToWarpcastButton({ projectIdOrPath }: { projectIdOrPath: string }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    setUrl(`${window.location.origin}/p/${projectIdOrPath}`);
  }, []);

  return (
    <WarpcastButton
      href={encodeURI(
        `https://warpcast.com/~/compose?text=I just registered for the Sunny Awards to be eligible for 540K OP!&embeds[]=${url}`
      )}
      text='Share'
    />
  );
}
