import React from 'react';
import Button from '@mui/material/Button';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';
import ERC20ABI from '../../abis/ERC20ABI.json';

interface Props {
  receiver: string;
  amount: string;
  token: string;
  tokenContractAddress?: string;
  tokenDecimals?: number;
  onSuccess?: (txId: string) => void;
  onError?: (err: any) => void;
  children: React.ReactChild | React.ReactChild[];
}

export default function BountyPaymentButton ({
  receiver,
  amount,
  token = 'Ether',
  tokenContractAddress = '',
  tokenDecimals = 16,
  onSuccess = (tx: string) => {},
  onError = () => {},
  children
}: Props) {
  const { account, library } = useWeb3React();

  const makePayment = async () => {

    const signer = await library.getSigner(account);

    try {
      if (token === 'Ether') {
        const tx = await signer.sendTransaction({
          to: receiver,
          value: ethers.utils.parseEther(amount)
        });

        onSuccess(tx.hash);
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
        onSuccess(tx.hash);
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
