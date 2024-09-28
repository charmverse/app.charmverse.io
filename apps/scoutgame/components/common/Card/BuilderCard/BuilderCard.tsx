'use client';

import { Button, Card, Stack, Typography } from '@mui/material';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import { useState } from 'react';

import { NFTPurchaseDialog } from 'components/nft/NFTPurchaseDialog';
import type { BuilderInfo } from 'lib/builders/interfaces';

import { BuilderCardNftDisplay } from './BuilderCardNftDisplay';
import { BuilderCardStats } from './BuilderCardStats';

function PriceButton({ price, onClick }: { price: bigint | number; onClick: VoidFunction }) {
  return (
    <Button fullWidth onClick={onClick} variant='buy'>
      ${(Number(price) / 10 ** builderTokenDecimals).toFixed(2)}
    </Button>
  );
}

export function BuilderCard({
  builder,
  user,
  showPurchaseButton = false,
  hideDetails = false,
  showHotIcon = false,
  size = 'medium'
}: {
  size?: 'small' | 'medium' | 'large';
  user?: {
    id: string;
    username: string;
  } | null;
  builder: BuilderInfo;
  hideDetails?: boolean;
  showPurchaseButton?: boolean;
  showHotIcon?: boolean;
}) {
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);

  return (
    <>
      <Card sx={{ border: 'none', opacity: builder.isBanned ? 0.25 : 1, width: 'fit-content' }}>
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
            <PriceButton onClick={() => setIsPurchasing(true)} price={builder.price} />
          </Stack>
        )}
      </Card>
      {isPurchasing && !!builder.price && showPurchaseButton && (
        <NFTPurchaseDialog onClose={() => setIsPurchasing(false)} builderId={builder.id} user={user} />
      )}
    </>
  );
}
