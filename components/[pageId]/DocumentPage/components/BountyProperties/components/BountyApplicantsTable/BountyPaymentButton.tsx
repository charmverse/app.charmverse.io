import React from 'react';
import { AlertColor } from '@mui/material/Alert';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import charmClient from 'charmClient';
import Button from '@mui/material/Button';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';
import { getChainById } from 'connectors';
import { isValidChainAddress } from 'lib/tokens/validation';
import ERC20ABI from '../../../../../../../abis/ERC20ABI.json';

interface Props {
  receiver: string;
  amount: string;
  tokenSymbolOrAddress: string;
  chainIdToUse: number
  onSuccess?: (txId: string, chainId: number) => void;
  onClick?: () => void
  onError?: (err: string, severity?: AlertColor) => void;
}

function extractWalletErrorMessage (error: any): string {
  if ((error)?.code === 'INSUFFICIENT_FUNDS') {
    return 'You do not have sufficient funds to perform this transaction';
  }
  else if ((error)?.code === 4001) {
    return 'You rejected the transaction';
  }
  else if ((error)?.code === -32602) {
    return 'A valid recipient must be provided';
  }
  else if ((error)?.reason) {
    return error.reason;
  }
  else if ((error)?.message) {
    return error.message;
  }
  else if (typeof error === 'object') {
    return JSON.stringify(error);
  }
  else if (typeof error === 'string') {
    return error;
  }
  else {
    return 'An unknown error occurred';
  }
}

/**
 * See
 * https://stackoverflow.com/a/68267546
 * @param chainId
 * @returns
 */
async function switchActiveNetwork (chainId: number) {
  try {
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ethers.utils.hexValue(chainId) }]
    });
    return;
  }
  catch (error: any) {
    if (error.code === 4902) {

      const chainInfo = getChainById(chainId);

      if (!chainInfo) {
        throw new Error('Unsupported chain');
      }

      return (window as any).ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            ...chainInfo,
            chainId: ethers.utils.hexValue(chainInfo?.chainId)
          }

        ]
      });

    }
    else {
      throw error;
    }
  }
}

export default function BountyPaymentButton ({
  receiver,
  amount,
  chainIdToUse,
  tokenSymbolOrAddress,
  onSuccess = (tx: string, chainId: number) => {},
  onClick = () => null,
  onError = () => {}
}: Props) {
  const { account, library, chainId } = useWeb3React();

  const [paymentMethods] = usePaymentMethods();

  const makePayment = async () => {

    if (!chainIdToUse) {
      onError('Please provide a chainId');
      return;
    }

    const chainToUse = getChainById(chainIdToUse);

    if (!chainToUse) {
      onError('This chain is not supported');
      return;
    }

    const currentUserChain = chainId ? getChainById(chainId) : undefined;

    if (!currentUserChain) {
      onError('Could not detect your chain');
      return;
    }

    try {

      if (chainToUse.chainId !== currentUserChain.chainId) {

        await switchActiveNetwork(chainToUse.chainId);
      }

      const signer = library.getSigner(account);

      if (chainToUse.nativeCurrency.symbol === tokenSymbolOrAddress) {
        const tx = await signer.sendTransaction({
          to: receiver,
          value: ethers.utils.parseEther(amount)
        });

        onSuccess(tx.hash, chainToUse.chainId);
      }
      else if (isValidChainAddress(tokenSymbolOrAddress)) {
        const tokenContract = new ethers.Contract(tokenSymbolOrAddress, ERC20ABI, signer);

        const paymentMethod = paymentMethods.find(method => (
          method.contractAddress === tokenSymbolOrAddress || method.id === tokenSymbolOrAddress
        ));
        let tokenDecimals = paymentMethod?.tokenDecimals;

        if (typeof tokenDecimals !== 'number') {
          try {
            const tokenInfo = await charmClient.getTokenMetaData({
              chainId: chainToUse!.chainId,
              contractAddress: tokenSymbolOrAddress
            });
            tokenDecimals = tokenInfo.decimals;
          }
          catch (error) {
            onError(`Token information is missing. Please go to payment methods to configure this payment method using contract address ${tokenSymbolOrAddress} on ${chainToUse.chainName}`);
            return;
          }
        }

        const parsedTokenAmount = ethers.utils.parseUnits(amount, tokenDecimals);

        // get allowance
        const allowance = await tokenContract.allowance(account, receiver);

        if (BigNumber.from(allowance).lt(parsedTokenAmount)) {
          // approve if the allowance is small
          await tokenContract.approve(receiver, parsedTokenAmount);
        }

        // transfer token
        const tx = await tokenContract.transfer(receiver, parsedTokenAmount);
        onSuccess(tx.hash, chainToUse!.chainId);
      }
      else {
        onError('Please provide a valid contract address');
      }
    }
    catch (err: any) {
      const errorMessage = extractWalletErrorMessage(err);

      if (errorMessage === 'underlying network changed') {
        onError("You've changed your active network.\r\nRe-select 'Make payment' to complete this transaction", 'warning');
      }
      else {
        onError(errorMessage);
      }
    }
  };

  return (
    <Button
      color='primary'
      size='small'
      onClick={() => {
        onClick();
        makePayment();
      }}
    >
      Send Payment
    </Button>
  );
}
