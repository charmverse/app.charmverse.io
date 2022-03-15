import React, { useEffect, useState } from 'react';
import { AlertColor } from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useWeb3React } from '@web3-react/core';
import { BigNumber } from '@ethersproject/bignumber';
import { getChainById, RPC } from 'connectors';
import Safe from '@gnosis.pm/safe-core-sdk';
import { MetaTransactionData } from '@gnosis.pm/safe-core-sdk-types';
import SafeServiceClient from '@gnosis.pm/safe-service-client';
import { useSafeAppConnection, SafeAppConnector } from '@gnosis.pm/safe-apps-web3-react';
import useGnosisSafe from './hooks/useGnosisSafe';

const safeAddress = '0xE7faB335A404a09ACcE83Ae5F08723d8e5c69b58';
const transactionServiceUrl = 'https://safe-transaction.rinkeby.gnosis.io';

// const safeMultisigConnector = new SafeAppConnector();

interface Props {
  transactions: MetaTransactionData[];
}

export default function MultiPayButton ({ transactions }: Props) {
  const { account } = useWeb3React();
  const safe = useGnosisSafe({ safeAddress });

  async function makePayment () {
    if (!safe) return;
    const safeTransaction = await safe.createTransaction(transactions);
    await safe.signTransaction(safeTransaction);
    const safeTxHash = await safe.getTransactionHash(safeTransaction);
    const safeService = new SafeServiceClient(transactionServiceUrl);
    await safeService.proposeTransaction({
      safeAddress,
      safeTransaction,
      safeTxHash,
      senderAddress: account!,
      origin
    });
    const { results } = await safeService.getPendingTransactions(safeAddress);
    console.log('pending transactions', results);
  }

  return (
    <Button disabled={!safe} onClick={makePayment}>
      Make Payment (
      {transactions.length}
      )
    </Button>
  );
}
