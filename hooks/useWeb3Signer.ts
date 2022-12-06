import type { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';

// a wrapper around account and library from web3react
export default function useWeb3Signer() {
  const { account, library } = useWeb3AuthSig();
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    if (account && library) {
      setSigner(library.getSigner(account));
    } else {
      setSigner(null);
    }
  }, [account, library]);

  return signer;
}
