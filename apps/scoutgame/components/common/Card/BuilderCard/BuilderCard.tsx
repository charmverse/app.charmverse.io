'use client';

import { Card, Stack, Typography } from '@mui/material';

import type { BuilderInfo } from 'lib/builders/interfaces';

import { ScoutButton } from '../../ScoutButton/ScoutButton';

import { BuilderCardNftDisplay } from './BuilderCardNftDisplay';
import { BuilderCardStats } from './BuilderCardStats';

export function BuilderCard({
  builder,
  showPurchaseButton = false,
  hideDetails = false,
  showHotIcon = false,
  size = 'medium',
  userId
}: {
  size?: 'x-small' | 'small' | 'medium' | 'large';
  builder: BuilderInfo;
  hideDetails?: boolean;
  showPurchaseButton?: boolean;
  showHotIcon?: boolean;
  userId?: string;
}) {
  return (
    <Card sx={{ border: 'none', opacity: builder.isBanned ? 0.25 : 1, width: 'fit-content', height: 'fit-content' }}>
      <BuilderCardNftDisplay
        nftImageUrl={builder.nftImageUrl}
        username={builder.username}
        showHotIcon={showHotIcon}
        size={size}
      >
        {builder.isBanned ? (
          <Typography textAlign='center'>BANNED</Typography>
        ) : hideDetails ? null : (
          <BuilderCardStats {...builder} />
        )}
      </BuilderCardNftDisplay>
      {typeof builder.price !== 'undefined' && showPurchaseButton && (
        <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
          <ScoutButton builder={builder} isAuthenticated={!!userId} />
        </Stack>
      )}
    </Card>
  );
}
