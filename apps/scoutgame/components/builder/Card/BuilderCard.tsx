'use client';

import { Button, Card, Stack } from '@mui/material';
import Link from 'next/link';

import type { BuilderInfo } from 'lib/builders/interfaces';

import { BuilderCardNftDisplay } from './BuilderCardNftDisplay';
import { BuilderCardStats } from './BuilderCardStats';

function PriceButton({ price, username }: { price: number; username: string }) {
  return (
    <Button fullWidth LinkComponent={Link} href={`/u/${username}/checkout`} variant='buy'>
      ${price}
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
  return (
    <Card sx={{ border: 'none' }}>
      <BuilderCardNftDisplay nftAvatar={builder.nftAvatar} username={builder.username}>
        {hideDetails ? null : (
          <BuilderCardStats
            gemsCollected={builder.gems}
            builderPoints={builder.builderPoints}
            scoutedBy={builder.scoutedBy}
            nfts={builder.nfts}
          />
        )}
      </BuilderCardNftDisplay>
      {typeof builder.price === 'number' && showPurchaseButton && (
        <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
          <PriceButton price={builder.price} username={builder.username} />
        </Stack>
      )}
    </Card>
  );
}
