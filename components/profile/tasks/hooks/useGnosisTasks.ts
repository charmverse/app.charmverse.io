import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { UserMultiSigWallet } from '@prisma/client';
import charmClient from 'charmClient';
import { Task } from 'models';
import { getGnosisTransactions } from 'lib/gnosis';
import useWeb3Signer from 'hooks/useWeb3Signer';
import { Signer } from 'ethers';

async function getGnosisTasks (signer: Signer, wallet: UserMultiSigWallet) {
  const transactions = await getGnosisTransactions(signer, wallet);
  console.log('transactions', transactions);
  return [];
}

export default function useGnosisTasks () {

  const signer = useWeb3Signer();
  const { data } = useSWR('/profile/multi-sigs', () => charmClient.listUserMultiSigs());
  const [tasks, setTasks] = useState<Task[]>([]);

  async function getTasks (_signer: Signer, wallets: UserMultiSigWallet[]): Promise<Task[]> {
    return Promise.all(wallets.map(wallet => getGnosisTasks(_signer, wallet)))
      .then(list => list.flat());
  }

  useEffect(() => {
    if (data && signer) {
      getTasks(signer, data).then(setTasks);
    }
  }, [data, signer]);

  return tasks;
}
