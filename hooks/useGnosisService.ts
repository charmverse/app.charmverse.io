import { useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import EthersAdapter from '@gnosis.pm/safe-ethers-lib';
import SafeServiceClient from '@gnosis.pm/safe-service-client';

export default function useGnosisService () {

  const [safeService, setSafeService] = useState<SafeServiceClient | null>(null);
  const { account, library } = useWeb3React();

  async function loadSafes () {
    const signer = await library.getSigner(account);
    const ethAdapter = new EthersAdapter({
      ethers,
      signer
    });
    const _safeService = new SafeServiceClient({
      txServiceUrl: 'https://safe-transaction.gnosis.io',
      ethAdapter
    });
    return _safeService;
  }

  useEffect(() => {
    if (account) {
      loadSafes().then(setSafeService);
    }
  }, [account]);

  return safeService;
}
