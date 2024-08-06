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
      href={encodeURI(`https://warpcast.com/~/compose?text=Checkout my new Project!&embeds[]=${url}`)}
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
