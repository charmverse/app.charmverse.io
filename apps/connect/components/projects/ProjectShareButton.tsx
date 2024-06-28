'use client';

import CheckIcon from '@mui/icons-material/Check';
import ShareIcon from '@mui/icons-material/Share';
import { Button } from '@mui/material';
import { useState } from 'react';

export function ShareButton() {
  const [clicked, setClicked] = useState(false);

  return (
    <Button
      onClick={() => {
        navigator.clipboard.writeText(window.location.href);
        setClicked(true);
        setTimeout(() => setClicked(false), 500);
      }}
      disabled={clicked}
      color='secondary'
      variant='outlined'
      startIcon={clicked ? <CheckIcon fontSize='small' /> : <ShareIcon fontSize='small' />}
    >
      {clicked ? 'Copied!' : 'Share'}
    </Button>
  );
}
