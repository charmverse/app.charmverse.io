'use client';

import { LoadingButton } from '@mui/lab';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import { convertCostToPointsWithDiscount } from '@packages/scoutgame/builderNfts/utils';
import dynamic from 'next/dynamic';
import Image from 'next/image';
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
  isAuthenticated = true,
  showPoints = false
}: {
  builder: MinimalUserInfo & { price?: bigint; nftImageUrl?: string | null };
  isAuthenticated?: boolean;
  showPoints?: boolean;
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

  const purchaseCostInPoints = convertCostToPointsWithDiscount(builder?.price || BigInt(0));

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
          {showPoints ? (
            <>
              {purchaseCostInPoints}
              <Image
                src='/images/profile/scout-game-blue-icon.svg'
                alt='Scout game points'
                width={21}
                height={12}
                style={{ marginLeft: 4, marginRight: 4 }}
              />
              (${(Number(builder.price) / 10 ** builderTokenDecimals).toFixed(0)})
            </>
          ) : (
            <>${(Number(builder.price) / 10 ** builderTokenDecimals).toFixed(0)}</>
          )}
        </LoadingButton>
        {isPurchasing && <NFTPurchaseDialog open onClose={() => setIsPurchasing(false)} builder={builder} />}
        <SignInModalMessage open={authPopup} onClose={() => setAuthPopup(false)} path={`/u/${builder.username}`} />
      </DynamicLoadingContext.Provider>
    </div>
  );
}
