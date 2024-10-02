'use client';

import { LoadingButton } from '@mui/lab';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import type { MinimalUserInfo } from 'lib/users/interfaces';

import { DynamicLoadingContext, LoadingComponent } from '../DynamicLoading';

import { SignInModalMessage } from './SignInModalMessage';

const NFTPurchaseDialog = dynamic(
  () => import('components/common/NFTPurchaseDialog/NFTPurchaseDialog').then((mod) => mod.NFTPurchaseDialog),
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
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [authPopup, setAuthPopup] = useState<boolean>(false);
  const [dialogLoadingStatus, setDialogLoadingStatus] = useState<boolean>(false);

  const handleClick = () => {
    if (isAuthenticated) {
      setIsPurchasing(true);
    } else {
      setAuthPopup(true);
    }
  };
  return (
    <div>
      <DynamicLoadingContext.Provider value={setDialogLoadingStatus}>
        <LoadingButton
          loading={dialogLoadingStatus}
          fullWidth
          onClick={handleClick}
          variant='buy'
          data-test='scout-button'
        >
          ${(Number(builder.price) / 10 ** builderTokenDecimals).toFixed(2)}
        </LoadingButton>
        {isPurchasing && <NFTPurchaseDialog open onClose={() => setIsPurchasing(false)} builder={builder} />}
        <SignInModalMessage open={authPopup} onClose={() => setAuthPopup(false)} path={`/u/${builder.username}`} />
      </DynamicLoadingContext.Provider>
    </div>
  );
}
