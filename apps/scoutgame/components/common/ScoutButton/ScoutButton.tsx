'use client';

import { Button } from '@mui/material';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import { useState } from 'react';

import { NFTPurchaseDialog } from 'components/nft/NFTPurchaseDialog';

export function ScoutButton({ builderId, price }: { builderId: string; price: bigint | number }) {
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  return (
    <>
      <Button fullWidth onClick={() => setIsPurchasing(true)} variant='buy'>
        ${(Number(price) / 10 ** builderTokenDecimals).toFixed(2)}
      </Button>
      {isPurchasing && <NFTPurchaseDialog onClose={() => setIsPurchasing(false)} builderId={builderId} />}
    </>
  );
}
