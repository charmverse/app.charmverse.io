'use client';

import ShareIcon from '@mui/icons-material/Share';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function ShareButton({ projectId }: { projectId: string }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  return (
    <Button
      LinkComponent={Link}
      href={encodeURI(
        `https://warpcast.com/~/compose?text=I just registered for the Sunny Awards to be eligible for 540K OP!&embeds[]=${url}`
      )}
      target='_blank'
      rel='noopener noreferrer'
      disabled={!projectId}
      color='secondary'
      variant='outlined'
      startIcon={<ShareIcon fontSize='small' />}
    >
      Share
    </Button>
  );
}
