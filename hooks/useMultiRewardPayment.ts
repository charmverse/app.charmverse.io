import type { Bounty } from '@charmverse/core/prisma';
import { Interface } from '@ethersproject/abi';
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types';
import { getChainById } from 'connectors/chains';
import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { getAddress, parseUnits } from 'viem';

import { useRewards } from 'components/rewards/hooks/useRewards';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { SafeData } from 'lib/gnosis';
import { getSafesForAddress } from 'lib/gnosis';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { eToNumber } from 'lib/utilities/numbers';
import { isTruthy } from 'lib/utilities/types';

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
  rewards
}: {
  rewards: Pick<RewardWithUsers, 'applications' | 'chainId' | 'id' | 'rewardAmount' | 'rewardToken'>[];
  selectedApplicationIds?: string[];
}) {
  const [gnosisSafeData, setGnosisSafeData] = useState<SafeData | null>(null);
  const { account, chainId } = useWeb3Account();

  const { pages } = usePages();

  const [paymentMethods] = usePaymentMethods();
  const { data: gnosisSafes } = useSWR(
    account && chainId ? `/connected-gnosis-safes/${account}` : null,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () => getSafesForAddress({ chainId: chainId!, address: account! })
  );

  const bountiesToPay = rewards.filter((reward) => {
    return (
      gnosisSafes?.some((safe) => reward.chainId === safe.chainId) &&
      isTruthy(reward.rewardAmount) &&
      isTruthy(reward.rewardToken) &&
      isTruthy(reward.chainId)
    );
  });

  const prepareGnosisSafeRewardPayment = useCallback(
    ({
      recipientAddress,
      recipientUserId,
      token,
      amount,
      txChainId,
      applicationId,
      rewardId,
      title
    }: {
      recipientAddress: string;
      recipientUserId: string;
      token: string;
      amount: string | number;
      txChainId: number;
      rewardId?: string;
      applicationId: string;
      title?: string;
    }) => {
      let data = '0x';
      let to = recipientAddress;
      let value = parseUnits(eToNumber(amount), 18).toString();

      // assume this is ERC20 if its not a native token
      const isERC20Token = token !== getChainById(txChainId)?.nativeCurrency.symbol;
      if (isERC20Token) {
        const paymentMethod = paymentMethods.find((method) => method.contractAddress === token);
        const erc20 = new Interface(ERC20_ABI);
        const parsedAmount = parseUnits(eToNumber(amount), paymentMethod!.tokenDecimals).toString();
        data = erc20.encodeFunctionData('transfer', [getAddress(recipientAddress), parsedAmount]);
        // send the request to the token contract
        to = token;
        value = '0';
      } else {
        to = getAddress(recipientAddress);
      }

      const defaultTitle = 'Untitled';

      const txMetadata: TransactionWithMetadata = {
        applicationId,
        chainId: txChainId,
        rewardAmount: Number(amount),
        data,
        rewardToken: token,
        title: title ?? (rewardId ? pages[rewardId]?.title : defaultTitle) ?? defaultTitle,
        to,
        userId: recipientUserId,
        value
      };

      return txMetadata;
    },
    []
  );

  // If the reward is on the same chain as the gnosis safe and the rewardToken of the reward is the same as the native currency of the gnosis safe chain
  const getTransactions: (safeAddress?: string) => TransactionWithMetadata[] = useCallback(
    (safeAddress?: string) => {
      return bountiesToPay
        .map((reward) =>
          reward.applications
            .filter((application) => application.walletAddress && application.status === 'complete')
            .map((application) => {
              return prepareGnosisSafeRewardPayment({
                amount: reward.rewardAmount as number,
                applicationId: application.id,
                recipientAddress: application.walletAddress as string,
                recipientUserId: application.createdBy,
                token: reward.rewardToken as string,
                txChainId: reward.chainId as number
              });
            })
        )
        .flat();
    },
    [rewards, gnosisSafes]
  );

  const isDisabled = bountiesToPay.length === 0;

  return {
    isDisabled,
    getTransactions,
    prepareGnosisSafeRewardPayment,
    gnosisSafes,
    gnosisSafeData,
    setGnosisSafeData
  };
}
