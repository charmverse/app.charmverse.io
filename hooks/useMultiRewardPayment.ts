import type { Bounty } from '@charmverse/core/prisma';
import { Interface } from '@ethersproject/abi';
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types';
import { getChainById } from 'connectors/chains';
import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { getAddress, parseUnits } from 'viem';

import charmClient from 'charmClient';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { SafeData } from 'lib/gnosis';
import { getSafesForAddress } from 'lib/gnosis';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { eToNumber } from 'lib/utilities/numbers';
import { isTruthy } from 'lib/utilities/types';

import type { MultiPaymentResult } from './useGnosisPayment';
import { usePages } from './usePages';

const ERC20_ABI = ['function transfer(address to, uint256 value)'];

export interface TransactionWithMetadata
  extends MetaTransactionData,
    Pick<Bounty, 'rewardToken' | 'rewardAmount' | 'chainId'> {
  applicationId: string;
  userId: string;
  title: string;
}

export function useMultiRewardPayment({
  rewards,
  postPaymentSuccess
}: {
  postPaymentSuccess?: () => void;
  rewards: Pick<RewardWithUsers, 'applications' | 'chainId' | 'id' | 'rewardAmount' | 'rewardToken'>[];
  selectedApplicationIds?: string[];
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [gnosisSafeData, setGnosisSafeData] = useState<SafeData | null>(null);
  const { mutateRewards: refreshRewards } = useRewards();
  const { account, chainId, signer } = useWeb3Account();

  const { pages } = usePages();

  const [paymentMethods] = usePaymentMethods();
  const { data: gnosisSafes } = useSWR(
    signer && account && chainId ? `/connected-gnosis-safes/${account}` : null,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () => getSafesForAddress({ signer: signer!, chainId: chainId!, address: account! })
  );

  const bountiesToPay = rewards.filter((reward) => {
    return (
      gnosisSafes?.some((safe) => reward.chainId === safe.chainId) &&
      isTruthy(reward.rewardAmount) &&
      isTruthy(reward.rewardToken) &&
      isTruthy(reward.chainId)
    );
  });

  // If the reward is on the same chain as the gnosis safe and the rewardToken of the reward is the same as the native currency of the gnosis safe chain
  const getTransactions: (safeAddress?: string) => TransactionWithMetadata[] = useCallback(
    (safeAddress?: string) => {
      return bountiesToPay
        .map((reward) =>
          reward.applications
            .filter((application) => application.walletAddress && application.status === 'complete')
            .map((application) => {
              let data = '0x';
              let to = application.walletAddress as string;
              let value = parseUnits(eToNumber(reward.rewardAmount as number), 18).toString();

              // assume this is ERC20 if its not a native token
              const isERC20Token =
                safeAddress && reward.rewardToken !== getChainById(reward.chainId as number)?.nativeCurrency.symbol;
              if (isERC20Token) {
                const paymentMethod = paymentMethods.find((method) => method.contractAddress === reward.rewardToken);
                const erc20 = new Interface(ERC20_ABI);
                const parsedAmount = parseUnits(
                  eToNumber(reward.rewardAmount as number),
                  paymentMethod!.tokenDecimals
                ).toString();
                data = erc20.encodeFunctionData('transfer', [application.walletAddress, parsedAmount]);
                // send the request to the token contract
                to = reward.rewardToken as string;
                value = '0';
              }

              return {
                // convert to checksum address, or else gnosis-safe will fail
                to: getAddress(to),
                value,
                data,
                applicationId: application.id,
                userId: application.createdBy,
                chainId: reward.chainId,
                rewardAmount: reward.rewardAmount,
                rewardToken: reward.rewardToken,
                title: pages[reward.id]?.title || 'Untitled'
              };
            })
        )
        .flat();
    },
    [rewards, gnosisSafes]
  );

  async function onPaymentSuccess(result: MultiPaymentResult) {
    const safeData = gnosisSafes?.find((safe) => safe.address === result.safeAddress);

    if (safeData) {
      setIsLoading(true);
      await Promise.all(
        result.transactions.map(async (transaction) => {
          await charmClient.rewards.recordTransaction({
            applicationId: transaction.applicationId,
            transactionId: result.txHash,
            safeTxHash: result.txHash,
            chainId: safeData.chainId.toString()
          });
        })
      );

      refreshRewards();
      setIsLoading(false);
      postPaymentSuccess?.();
    }
  }

  const isDisabled = bountiesToPay.length === 0;

  return {
    isLoading,
    isDisabled,
    getTransactions,
    onPaymentSuccess,
    gnosisSafes,
    gnosisSafeData,
    setGnosisSafeData
  };
}
