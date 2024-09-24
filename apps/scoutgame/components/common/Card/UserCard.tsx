'use client';

import type { Scout } from '@charmverse/core/prisma-client';
import { Button, Stack } from '@mui/material';
import { useState } from 'react';

import { NFTPurchaseDialog } from 'components/nft/NFTPurchaseDialog';
import type { BuilderUserInfo } from 'lib/builders/interfaces';

import { BasicUserCard } from './BasicUserCard';
import { UserCardDetails } from './UserCardDetails';

const conversion = 1e18;

function CardButton({ price, username, onClick }: { price: bigint; username: string; onClick?: () => void }) {
  return (
    // TODO - Implement pattern with page modal interception
    // <Button fullWidth LinkComponent={Link} href={`/u/${username}/checkout`} variant='buy'>
    //   ${price}
    // </Button>

    // For now, use an onclick pattern
    <Button fullWidth onClick={onClick} variant='buy'>
      ${(Number(price) / conversion).toFixed(2)}
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
  user: BuilderUserInfo;
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
        childrenInside={
          withDetails && <UserCardDetails gems={user.gems} scoutedBy={user.scoutedBy} price={user.price} />
        }
      >
        {user.price ? (
          <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
            <CardButton onClick={() => setIsPurchasing(true)} price={BigInt(user.price)} username={user.username} />
            {isPurchasing && (
              <NFTPurchaseDialog onClose={() => setIsPurchasing(false)} builderId={user.id} scout={scout} />
            )}
          </Stack>
        ) : null}
      </BasicUserCard>
    );
  }

  return (
    <BasicUserCard user={user} childrenInside={withDetails && <UserCardDetails gems={user.gems} />}>
      {withDetails || user.price ? (
        <Stack gap={1} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }} px={withDetails ? 1 : 0}>
          {withDetails && <UserCardDetails nftsSold={user.nftsSold} />}
          {user.price && (
            <CardButton onClick={() => setIsPurchasing(true)} price={BigInt(user.price)} username={user.username} />
          )}
        </Stack>
      ) : null}
      {isPurchasing && <NFTPurchaseDialog onClose={() => setIsPurchasing(false)} builderId={user.id} scout={scout} />}
    </BasicUserCard>
  );
}
