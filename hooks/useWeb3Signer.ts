import { useWeb3React } from '@web3-react/core';
import type { ethers } from 'ethers';
import { useEffect, useState } from 'react';

// a wrapper around account and library from web3react
export default function useWeb3Signer () {

  const { account, library } = useWeb3React();
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    if (account && library) {
      setSigner(library.getSigner(account));
    }
  }, [account, library]);

  return signer;
}
