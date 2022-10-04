import type { MetaTransactionData } from '@gnosis.pm/safe-core-sdk-types';
import type { Bounty } from '@prisma/client';
import { useWeb3React } from '@web3-react/core';
import { getChainById } from 'connectors';
import { ethers } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { MultiPaymentResult } from 'components/bounties/components/MultiPaymentButton';
import useGnosisSigner from 'hooks/useWeb3Signer';
import type { BountyWithDetails } from 'lib/bounties';
import type { SafeData } from 'lib/gnosis';
import { getSafesForAddress } from 'lib/gnosis';
import { eToNumber } from 'lib/utilities/numbers';
import { isTruthy } from 'lib/utilities/types';

import { useBounties } from './useBounties';
import { useCurrentSpace } from './useCurrentSpace';

export interface TransactionWithMetadata extends MetaTransactionData, Pick<Bounty, 'rewardToken' | 'rewardAmount' | 'chainId'>{
  applicationId: string;
  userId: string;
  title: string;
}

export function useMultiBountyPayment ({ bounties, postPaymentSuccess }:
  { postPaymentSuccess?: () => void, bounties: BountyWithDetails[], selectedApplicationIds?: string[] }) {
  const [isLoading, setIsLoading] = useState(false);
  const [gnosisSafeData, setGnosisSafeData] = useState<SafeData | null>(null);
  const { setBounties, setCurrentBounty, currentBountyId } = useBounties();
  const [currentSpace] = useCurrentSpace();
  const { account, chainId } = useWeb3React();
  const signer = useGnosisSigner();
  const { data: safeData } = useSWR(
    (signer && account && chainId) ? `/connected-gnosis-safes/${account}` : null,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () => getSafesForAddress({ signer: signer!, chainId: chainId!, address: account! })
  );

  useEffect(() => {
    if (safeData) {
      setGnosisSafeData(safeData[0]);
    }
  }, [safeData]);

  const gnosisSafeAddress = gnosisSafeData?.address;
  const gnosisSafeChainId = gnosisSafeData?.chainId;

  // If the bounty is on the same chain as the gnosis safe and the rewardToken of the bounty is the same as the native currency of the gnosis safe chain
  const transactions: TransactionWithMetadata[] = useMemo(
    () => bounties
      .filter(bounty => {
        return safeData
          ? safeData.find(
            ({ chainId: safeChainId }) => bounty.chainId === safeChainId && bounty.rewardToken === getChainById(safeChainId)?.nativeCurrency.symbol
          )
          : false;
      })
      .map(bounty => {
        return bounty.applications.map(application => {
          if (application.status === 'complete') {
            const value = ethers.utils.parseUnits(eToNumber(bounty.rewardAmount), 18).toString();
            return {
              to: application.walletAddress as string,
              value,
              // This has to be 0x don't change it
              data: '0x',
              applicationId: application.id,
              userId: application.createdBy,
              chainId: bounty.chainId,
              rewardAmount: bounty.rewardAmount,
              rewardToken: bounty.rewardToken,
              title: bounty.page?.title || 'Untitled'
            };
          }
          return false;
        }).filter(isTruthy);
      })
      .flat(),
    [bounties, safeData]
  );

  async function onPaymentSuccess (result: MultiPaymentResult) {
    if (gnosisSafeAddress && gnosisSafeChainId) {
      setIsLoading(true);
      await Promise.all(
        result.transactions.map(async (transaction) => {
          await charmClient.bounties.recordTransaction({
            applicationId: transaction.applicationId,
            transactionId: result.txHash,
            chainId: gnosisSafeChainId.toString()
          });
          await charmClient.bounties.markSubmissionAsPaid(transaction.applicationId);
        })
      );

      if (currentSpace) {
        charmClient.bounties.listBounties(currentSpace.id)
          .then(_bounties => {
            setBounties(_bounties);
            const newCurrentBounty = _bounties.find(_bounty => _bounty.id === currentBountyId);
            if (newCurrentBounty) {
              setCurrentBounty({ ...newCurrentBounty });
            }
          });
      }
      setIsLoading(false);
      postPaymentSuccess?.();
    }
  }

  const isDisabled = transactions.length === 0;

  return {
    isLoading,
    isDisabled,
    transactions,
    onPaymentSuccess,
    gnosisSafeChainId,
    gnosisSafeAddress,
    safeData,
    gnosisSafeData,
    setGnosisSafeData
  };
}
