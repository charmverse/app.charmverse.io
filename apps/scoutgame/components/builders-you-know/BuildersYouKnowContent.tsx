'use client';

import { Button, Grid2, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { BuildersGallery } from '@packages/scoutgame-ui/components/common/Gallery/BuildersGallery';
import Link from 'next/link';
import React from 'react';

export function BuildersYouKnowContent({
  onClickContinue,
  builders
}: {
  onClickContinue?: React.MouseEventHandler;
  builders: BuilderInfo[];
}) {
  return (
    <Grid2 gap={2}>
      <Grid2 size={{ xs: 12 }}>
        <Typography color='secondary' textAlign='center' width='100%' fontWeight={700} variant='h5'>
          Builders You Know
        </Typography>
      </Grid2>

      <BuildersGallery size='small' builders={builders} />

      <Grid2 size={{ xs: 12 }}>
        <Button
          LinkComponent={Link}
          variant='contained'
          onClick={onClickContinue}
          href='/'
          data-test='continue-button'
          sx={{ margin: '0 auto', px: 1, display: 'flex', width: 'fit-content' }}
        >
          Go to Scout Game
        </Button>
      </Grid2>
    </Grid2>
  );
}
