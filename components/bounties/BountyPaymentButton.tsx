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
    const signer = await library.getSigner(account);

    console.log('Signer', signer);

    try {
      // if it's native currency
      if (tokenSymbol.toLowerCase() === currentChain?.nativeCurrency.symbol.toLowerCase()) {
        const tx = await signer.sendTransaction({
          to: receiver,
          value: ethers.utils.parseEther(amount)
        });

        onSuccess(tx.hash, currentChain.chainId);
      }
      else {
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
    }
    catch (err) {
      onError(err);
    }
  };

  return (
    <Button onClick={makePayment}>{children}</Button>
  );
}
