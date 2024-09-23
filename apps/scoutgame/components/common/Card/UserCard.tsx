'use client';

import type { Scout } from '@charmverse/core/prisma-client';
import { Button, Stack } from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';

import { NFTPurchaseDialog } from 'components/nft/NFTPurchaseDialog';
import type { TopBuilder } from 'lib/builders/getTopBuilders';

import { BasicUserCard } from './BasicUserCard';
import { UserCardDetails } from './UserCardDetails';

function CardButton({ price, username }: { price: number; username: string }) {
  return (
    <Button fullWidth LinkComponent={Link} href={`/u/${username}/checkout`} variant='buy'>
      ${price}
    </Button>
  );
}

export function UserCard({
  withDetails,
  user,
  scout,
  variant = 'small'
}: {
  withDetails: boolean;
  user: TopBuilder;
  scout?: Scout | null;
  variant?: 'big' | 'small';
}) {
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);

  if (!user?.avatar) {
    return null;
  }

  if (variant === 'big') {
    return (
      <BasicUserCard
        user={user}
        chidlrenInside={withDetails && <UserCardDetails gems={user.gems} likes={user.likes} />}
      >
        {user.price && (
          <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
            <CardButton price={user.price} username={user.username} />
          </Stack>
        )}
      </BasicUserCard>
    );
  }

  return (
    <BasicUserCard user={user} chidlrenInside={withDetails && <UserCardDetails gems={user.gems} />}>
      {(withDetails || user.price) && (
        <Stack gap={1} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }} px={withDetails ? 1 : 0}>
          {withDetails && <UserCardDetails nfts={user.nftsBought} />}
          {user.price && <CardButton price={user.price} username={user.username} />}
        </Stack>
      )}
      <NFTPurchaseDialog
        onClose={() => setIsPurchasing(false)}
        builderId={isPurchasing ? user.id : undefined}
        scout={scout}
      />
    </BasicUserCard>
  );
}
