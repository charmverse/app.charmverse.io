'use client';

import { Button, Stack } from '@mui/material';
import Link from 'next/link';

import type { BuilderUserInfo } from 'lib/builders/interfaces';

import { BasicUserCard } from './BasicUserCard';
import { UserCardDetails } from './UserCardDetails';

export function UserCard({
  withDetails,
  user,
  variant = 'small'
}: {
  withDetails?: boolean;
  user: BuilderUserInfo;
  variant?: 'big' | 'small';
}) {
  if (variant === 'big') {
    return (
      <BasicUserCard
        user={user}
        childrenInside={withDetails && <UserCardDetails gems={user.gems} scouts={user.scouts} likes={user.likes} />}
      >
        {user.price ? (
          <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
            <CardButton price={user.price} username={user.username} />
          </Stack>
        ) : null}
      </BasicUserCard>
    );
  }

  return (
    <BasicUserCard user={user} childrenInside={withDetails && <UserCardDetails gems={user.gems} />}>
      {withDetails || user.price ? (
        <Stack gap={1} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }} px={withDetails ? 1 : 0}>
          {withDetails && <UserCardDetails scouts={user.scouts} nfts={user.nfts} />}
          {user.price ? <CardButton price={user.price} username={user.username} /> : null}
        </Stack>
      ) : null}
    </BasicUserCard>
  );
}

function CardButton({ price, username }: { price: number; username: string }) {
  return (
    <Button fullWidth LinkComponent={Link} href={`/u/${username}/checkout`} variant='buy'>
      ${price}
    </Button>
  );
}
