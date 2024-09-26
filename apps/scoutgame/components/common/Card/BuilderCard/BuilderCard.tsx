'use client';

import { Button, Card, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { NFTPurchaseDialog } from 'components/nft/NFTPurchaseDialog';
import type { BuilderInfo } from 'lib/builders/interfaces';

import { BuilderCardNftDisplay } from './BuilderCardNftDisplay';
import { BuilderCardStats } from './BuilderCardStats';

const conversion = 1e18;

function PriceButton({
  price,
  username,
  onClick
}: {
  price: bigint | number;
  username: string;
  onClick?: VoidFunction;
}) {
  return (
    <Button fullWidth onClick={onClick} variant='buy'>
      ${(Number(price) / conversion).toFixed(2)}
    </Button>
  );
}

export function BuilderCard({
  builder,
  user,
  showPurchaseButton = false,
  hideDetails = false
}: {
  user?: {
    username: string;
  } | null;
  builder: BuilderInfo;
  hideDetails?: boolean;
  showPurchaseButton?: boolean;
}) {
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  return (
    <>
      <Card sx={{ border: 'none', opacity: builder.isBanned ? 0.25 : 1 }}>
        <BuilderCardNftDisplay avatar={builder.avatar} username={builder.username}>
          {builder.isBanned ? (
            <Typography textAlign='center'>BANNED</Typography>
          ) : hideDetails ? null : (
            <BuilderCardStats {...builder} />
          )}
        </BuilderCardNftDisplay>
        {typeof builder.price !== 'undefined' && showPurchaseButton && (
          <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
            <PriceButton price={builder.price} username={builder.username} />
          </Stack>
        )}
      </Card>
      {isPurchasing && typeof builder.price === 'number' && showPurchaseButton && (
        <NFTPurchaseDialog onClose={() => setIsPurchasing(false)} builderId={builder.id} user={user} />
      )}
    </>
  );
}
