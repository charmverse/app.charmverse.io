import type { Bounty } from '@charmverse/core/prisma';
import { Interface } from '@ethersproject/abi';
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types';
import { getChainById } from 'connectors/chains';
import { ethers } from 'ethers';
import { useCallback } from 'react';
import { getAddress, parseUnits } from 'viem';

import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { eToNumber } from 'lib/utilities/numbers';

import { usePages } from './usePages';

const ERC20_ABI = ['function transfer(address to, uint256 value)'];

export interface TransactionWithMetadata
  extends MetaTransactionData,
    Pick<Bounty, 'rewardToken' | 'rewardAmount' | 'chainId'> {
  applicationId: string;
  userId: string;
  title: string;
}

export function useMultiRewardPayment() {
  const { pages } = usePages();
  const [paymentMethods] = usePaymentMethods();
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
        to =
          recipientAddress.endsWith('.eth') && ethers.utils.isValidName(recipientAddress)
            ? recipientAddress
            : getAddress(recipientAddress);
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

  return {
    prepareGnosisSafeRewardPayment
  };
}
