'use client';

import { Card, Stack, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { ScoutButton } from '../../ScoutButton/ScoutButton';

import { BuilderCardNftDisplay } from './BuilderCardNftDisplay';
import { BuilderCardStats } from './BuilderCardStats';

type RequiredBuilderInfoFields = 'displayName' | 'builderStatus' | 'id' | 'path' | 'nftType';

export function BuilderCard({
  builder,
  showPurchaseButton = false,
  hideDetails = false,
  showHotIcon = false,
  size = 'medium',
  disableProfileUrl = false,
  disableStarterCardPoints = false
}: {
  size?: 'x-small' | 'small' | 'medium' | 'large';
  builder: Omit<Partial<BuilderInfo>, RequiredBuilderInfoFields> & Pick<BuilderInfo, RequiredBuilderInfoFields>;
  hideDetails?: boolean;
  showPurchaseButton?: boolean;
  showHotIcon?: boolean;
  disableProfileUrl?: boolean;
  disableStarterCardPoints?: boolean;
}) {
  return (
    <Card
      sx={{
        border: 'none',
        opacity: builder.builderStatus === 'banned' ? 0.25 : 1,
        width: 'fit-content',
        height: 'fit-content',
        margin: '0 auto'
      }}
    >
      <BuilderCardNftDisplay
        nftImageUrl={builder.nftImageUrl}
        path={builder.path}
        showHotIcon={showHotIcon}
        size={size}
        hideDetails={hideDetails}
        disableProfileUrl={disableProfileUrl}
      >
        {builder.builderStatus === 'banned' ? (
          <Typography textAlign='center'>SUSPENDED</Typography>
        ) : hideDetails ? null : (
          <BuilderCardStats {...builder} size={size} />
        )}
      </BuilderCardNftDisplay>
      {typeof builder.price !== 'undefined' && showPurchaseButton && (
        <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
          <ScoutButton builder={builder} disableStarterCardPoints={disableStarterCardPoints} />
        </Stack>
      )}
    </Card>
  );
}
