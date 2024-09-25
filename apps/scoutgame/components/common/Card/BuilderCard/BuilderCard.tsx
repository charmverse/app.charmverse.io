'use client';

import { Button, Card, Stack } from '@mui/material';
import { useState } from 'react';

import { NFTPurchaseDialog } from 'components/nft/NFTPurchaseDialog';
import type { BuilderInfo } from 'lib/builders/interfaces';

import { BuilderCardNftDisplay } from './BuilderCardNftDisplay';
import { BuilderCardStats } from './BuilderCardStats';

const conversion = 1e18;

function PriceButton({ price, username, onClick }: { price: number; username: string; onClick?: VoidFunction }) {
  return (
    <Button fullWidth onClick={onClick} variant='buy'>
      ${(Number(price) / conversion).toFixed(2)}
    </Button>
  );
}

export function BuilderCard({
  builder,
  showPurchaseButton = false,
  hideDetails = false
}: {
  builder: BuilderInfo;
  hideDetails?: boolean;
  showPurchaseButton?: boolean;
}) {
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  return (
    <>
      <Card sx={{ border: 'none' }}>
        <BuilderCardNftDisplay avatar={builder.avatar} username={builder.username}>
          {hideDetails ? null : <BuilderCardStats {...builder} />}
        </BuilderCardNftDisplay>
        {typeof builder.price === 'number' && showPurchaseButton && (
          <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
            <PriceButton price={builder.price} username={builder.username} />
          </Stack>
        )}
      </Card>
      {isPurchasing && typeof builder.price === 'number' && showPurchaseButton && (
        // TODO: Pass current scout
        <NFTPurchaseDialog onClose={() => setIsPurchasing(false)} builderId={builder.id} scout={builder.scoutedBy} />
      )}
    </>
  );
}
