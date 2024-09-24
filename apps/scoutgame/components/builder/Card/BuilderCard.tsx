'use client';

import { Button, Card, Stack } from '@mui/material';
import Link from 'next/link';

import { BuilderCardNftDisplay } from './BuilderCardNftDisplay';
import { BuilderCardStats } from './BuilderCardStats';

export type BuilderInfo = {
  id: string;
  nftAvatar: string;
  username: string;
  displayName: string;
  builderPoints: number;
  price?: number;
  gems: number;
  nfts?: number;
  isBanned?: boolean;
  scoutedBy?: number;
};

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
      {builder.price && showPurchaseButton && (
        <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
          <PriceButton price={builder.price} username={builder.username} />
        </Stack>
      )}
    </Card>
  );
}
