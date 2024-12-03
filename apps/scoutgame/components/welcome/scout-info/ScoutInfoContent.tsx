'use client';

import { Box, Button, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { BuilderCard } from '@packages/scoutgame-ui/components/common/Card/BuilderCard/BuilderCard';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import Link from 'next/link';
import React from 'react';

export function ScoutInfoContent({ builder }: { builder: BuilderInfo }) {
  const isMdScreen = useMdScreen();
  const iconSize = isMdScreen ? 24 : 18;
  return (
    <>
      <Typography color='secondary' textAlign='center' width='100%' fontWeight={700} variant='h5'>
        Last Step!
      </Typography>
      <Box>
        <Box my={2}>
          <BuilderCard builder={builder} />
        </Box>
        <Typography my={2}>
          You score points by collecting the NFTs of Builders. You can Scout your first 3 builders for 95% off their
          normal price.
        </Typography>
      </Box>
      <Button
        LinkComponent={Link}
        variant='contained'
        href='/welcome/how-it-works'
        data-test='start-scouting-button'
        sx={{ margin: '8px auto', display: 'flex', width: 'fit-content' }}
      >
        Start Scouting
      </Button>
    </>
  );
}
