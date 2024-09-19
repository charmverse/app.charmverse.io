'use client';

import { Button, Stack } from '@mui/material';
import Link from 'next/link';

import { BasicUserCard } from './BasicUserCard';
import { UserCardDetails } from './UserCardDetails';

export function UserCard({
  withDetails = true,
  user,
  variant = 'small'
}: {
  withDetails?: boolean;
  user: any;
  variant?: 'big' | 'small';
}) {
  if (!user?.avatar) {
    return null;
  }

  if (variant === 'big') {
    return (
      <BasicUserCard
        user={user}
        chidlrenInside={withDetails && <UserCardDetails gems={user.gems} scouts={user.scouts} likes={user.likes} />}
      >
        <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
          <CardButton price={user.price} username={user.username} />
        </Stack>
      </BasicUserCard>
    );
  }

  return (
    <BasicUserCard user={user} chidlrenInside={withDetails && <UserCardDetails gems={user.gems} />}>
      <Stack gap={1} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }} px={{ xs: 1 }}>
        <UserCardDetails scouts={user.scouts} nfts={user.nfts} />
        <CardButton price={user.price} username={user.username} />
      </Stack>
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
