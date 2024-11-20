'use client';

import InfoIcon from '@mui/icons-material/Info';
import { IconButton, Stack, Typography } from '@mui/material';
import { Dialog } from '@packages/scoutgame-ui/components/common/Dialog';
import { useState } from 'react';

function BuilderInfoContent() {
  return (
    <Stack>
      <Typography variant='body2' fontWeight='bold'>
        RANK
      </Typography>
      <Typography mb={2}>
        Builder’s current rank in the weekly Gem competition. The Builder’s rank at the end of the week determines the
        amount of Scout Points earned. Higher rank = more Scout Points.
      </Typography>

      <Typography variant='body2' fontWeight='bold'>
        PRICE
      </Typography>
      <Typography mb={2}>
        The current cost of the Builder’s Card in Scout Points. Purchase the Builder’s Card to scout the Builder and
        earn scout points as they move up the leader board. Builder cards may also be purchased with USDC or ETH on
        Optimism, Base, Arbitrum, and Zora.
      </Typography>

      <Typography variant='body2' fontWeight='bold'>
        POINTS
      </Typography>
      <Typography mb={2}>Scout Points earned by the Builder this season to date.</Typography>

      <Typography variant='body2' fontWeight='bold'>
        CARDS
      </Typography>
      <Typography mb={2}>
        Total number of Builder Cards sold for that Builder. The price of the Builder’s card increases by 20 Scout
        Points after each sale. At the end of the week, Scouts that hold a Builder’s card(s) receive a share of that
        Builder’s Scout Point earnings.
      </Typography>
    </Stack>
  );
}

function ScoutInfoContent() {
  return (
    <Stack>
      <Typography variant='body2' fontWeight='bold'>
        RANK
      </Typography>
      <Typography mb={2}>
        Scout’s current rank in the season based on Scout Points earned to date. Scouts earn Scout Points by holding the
        Cards of Builders participating in the weekly Gem competition by contributing to qualified open source
        repositories.
      </Typography>

      <Typography variant='body2' fontWeight='bold'>
        POINTS
      </Typography>
      <Typography mb={2}>Scout Points earned by the Scout this season to date.</Typography>

      <Typography variant='body2' fontWeight='bold'>
        BUILDERS
      </Typography>
      <Typography mb={2}>Number of unique Builders scouted.</Typography>

      <Typography variant='body2' fontWeight='bold'>
        CARDS
      </Typography>
      <Typography mb={2}>Total number of Builder Cards held by the Scout.</Typography>
    </Stack>
  );
}

export function InfoModal({ builder = false }: { builder?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: 'absolute',
          right: 10,
          top: 0,
          color: 'secondary.main'
        }}
      >
        <InfoIcon />
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Typography my={2} variant='h5' color='secondary'>
          {builder ? 'Builders' : 'Scouts'} Data Table
        </Typography>
        {builder ? <BuilderInfoContent /> : <ScoutInfoContent />}
      </Dialog>
    </>
  );
}
