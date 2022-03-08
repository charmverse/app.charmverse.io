import React from 'react';
import Button from '@mui/material/Button';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';
import { getChainById, RPC } from 'connectors';
import ERC20ABI from '../../abis/ERC20ABI.json';

interface Props {
  receiver: string;
  amount: string;
  tokenSymbol: string;
  tokenContractAddress?: string;
  tokenDecimals?: number;
  chainIdToUse: number
  onSuccess?: (txId: string, chainId: number) => void;
  onError?: (err: any) => void;
  children?: React.ReactChild | React.ReactChild[];
}

export default function BountyPaymentButton ({
  receiver,
  amount,
  chainIdToUse,
  tokenSymbol = 'ETH',
  tokenContractAddress = '',
  tokenDecimals = 16,
  onSuccess = (tx: string, chainId: number) => {},
  onError = () => {},
  children = 'Make a payment'
}: Props) {
  const { account, library, chainId } = useWeb3React();

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

    const signer = await library.getSigner(account);

    if (chainToUse.chainId !== currentUserChain.chainId) {
      // Attempt to switch chains
    }

    try {
      if (chainToUse.nativeCurrency.symbol === tokenSymbol) {
        const tx = await signer.sendTransaction({
          to: receiver,
          value: ethers.utils.parseEther(amount)
        });

        onSuccess(tx.hash, chainToUse.chainId);
      }
      else if (tokenContractAddress) {
        const tokenContract = new ethers.Contract(tokenContractAddress, ERC20ABI, signer);
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
        onError('Token contract address required');
      }
    }
    catch (err) {

      const metaMaskError = (err as any).data?.message;

      if ((err as any)?.code === 'INSUFFICIENT_FUNDS') {
        onError('You do not have sufficient funds to perform this transaction.');
      }
      else if (metaMaskError) {
        onError(metaMaskError.replace('err: ', ''));
      }
      else {
        onError((err as any).reason || err);
      }
    }
  };

  return (
    <Button onClick={makePayment}>{children}</Button>
  );
}
