'use client';

import { Button } from '@mui/material';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { MinimalUserInfo } from 'lib/users/interfaces';

const NFTPurchaseDialog = dynamic(() =>
  import('components/common/NFTPurchaseForm/NFTPurchaseDialog').then((mod) => mod.NFTPurchaseDialogWithProviders)
);

export function ScoutButton({
  builder,
  isAuthenticated = true
}: {
  builder: MinimalUserInfo & { price?: bigint; nftImageUrl?: string | null };
  isAuthenticated?: boolean;
}) {
  const router = useRouter();
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);

  const handleClick = () => {
    if (isAuthenticated) {
      setIsPurchasing(true);
    } else {
      router.push('/login');
    }
  };

  return (
    <>
      <Button fullWidth onClick={handleClick} variant='buy' data-test='scout-button'>
        ${(Number(builder.price) / 10 ** builderTokenDecimals).toFixed(2)}
      </Button>
      <NFTPurchaseDialog open={isPurchasing} onClose={() => setIsPurchasing(false)} builder={builder} />
    </>
  );
}
