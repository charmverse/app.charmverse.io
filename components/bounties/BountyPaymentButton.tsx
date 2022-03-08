import React from 'react';
import Button from '@mui/material/Button';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';
import { RPC } from 'connectors';
import ERC20ABI from '../../abis/ERC20ABI.json';

interface Props {
  receiver: string;
  amount: string;
  tokenSymbol: string;
  tokenContractAddress?: string;
  tokenDecimals?: number;
  onSuccess?: (txId: string, chainId: number | string) => void;
  onError?: (err: any) => void;
  children?: React.ReactChild | React.ReactChild[];
}

export default function BountyPaymentButton ({
  receiver,
  amount,
  tokenSymbol = 'ETH',
  tokenContractAddress = '',
  tokenDecimals = 16,
  onSuccess = (tx: string, chainId: number | string) => {},
  onError = () => {},
  children = 'Make a payment'
}: Props) {
  const { account, library, chainId } = useWeb3React();

  const makePayment = async () => {

    const currentChain = Object.values(RPC).find((blockchain: any) => blockchain.chainId === chainId);
    const nativeChains = Object.values(RPC).filter((blockchain: any) => (
      blockchain.nativeCurrency.symbol.toLowerCase() === tokenSymbol.toLowerCase()));
    const signer = await library.getSigner(account);

    try {
      if (!currentChain) {
        onError('Unsupported chain');
      }
      // if it's native currency
      else if (nativeChains.some(chain => chain.chainId === currentChain.chainId)) {
        const tx = await signer.sendTransaction({
          to: receiver,
          value: ethers.utils.parseEther(amount)
        });

        onSuccess(tx.hash, currentChain.chainId);
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
        onSuccess(tx.hash, currentChain!.chainId);
      }
      else {
        onError('Token contract address required');
      }
    }
    catch (err) {
      // MetaMask error
      const metaMaskError = (err as any).data.message;
      if (metaMaskError) {
        onError(metaMaskError.replace('err: ', ''));
      }
      else {
        onError((err as Error).message || err);
      }
    }
  };

  return (
    <Button onClick={makePayment}>{children}</Button>
  );
}
