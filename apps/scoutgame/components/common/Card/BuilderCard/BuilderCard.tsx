'use client';

import { Button, Card, Stack, Typography } from '@mui/material';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import { useState } from 'react';

import type { BuilderInfo } from 'lib/builders/interfaces';

import { ScoutButton } from '../../ScoutButton/ScoutButton';

import { BuilderCardNftDisplay } from './BuilderCardNftDisplay';
import { BuilderCardStats } from './BuilderCardStats';

export function BuilderCard({
  builder,
  user,
  showPurchaseButton = false,
  hideDetails = false,
  showHotIcon = false
}: {
  user?: {
    id: string;
    username: string;
  } | null;
  builder: BuilderInfo;
  hideDetails?: boolean;
  showPurchaseButton?: boolean;
  showHotIcon?: boolean;
}) {
  return (
    <Card sx={{ border: 'none', opacity: builder.isBanned ? 0.25 : 1 }}>
      <BuilderCardNftDisplay nftImageUrl={builder.nftImageUrl} username={builder.username} showHotIcon={showHotIcon}>
        {builder.isBanned ? (
          <Typography textAlign='center'>BANNED</Typography>
        ) : hideDetails ? null : (
          <BuilderCardStats {...builder} />
        )}
      </BuilderCardNftDisplay>
      {typeof builder.price !== 'undefined' && showPurchaseButton && (
        <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
          <ScoutButton builderId={builder.id} price={builder.price} />
        </Stack>
      )}
    </Card>
  );
}
