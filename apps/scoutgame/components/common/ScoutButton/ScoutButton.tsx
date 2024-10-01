'use client';

import { LoadingButton } from '@mui/lab';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { MinimalUserInfo } from 'lib/users/interfaces';

import { DynamicLoadingContext, LoadingComponent } from '../DynamicLoading';

const NFTPurchaseDialog = dynamic(
  () => import('components/common/NFTPurchaseForm/NFTPurchaseDialog').then((mod) => mod.NFTPurchaseDialogWithProviders),
  {
    loading: LoadingComponent,
    ssr: false
  }
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
  const [dialogLoadingStatus, setDialogLoadingStatus] = useState<boolean>(false);
  const handleClick = () => {
    if (isAuthenticated) {
      setIsPurchasing(true);
    } else {
      router.push('/login');
    }
  };
  return (
    <div>
      <DynamicLoadingContext.Provider value={setDialogLoadingStatus}>
        <LoadingButton loading={dialogLoadingStatus} fullWidth onClick={handleClick} variant='buy'>
          ${(Number(builder.price) / 10 ** builderTokenDecimals).toFixed(2)}
        </LoadingButton>
        {isPurchasing && <NFTPurchaseDialog open onClose={() => setIsPurchasing(false)} builder={builder} />}
      </DynamicLoadingContext.Provider>
    </div>
  );
}
