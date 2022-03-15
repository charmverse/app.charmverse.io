import React, { useEffect, useState } from 'react';
import { AlertColor } from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';
import { getChainById, RPC } from 'connectors';
import Safe from '@gnosis.pm/safe-core-sdk';
import EthersAdapter from '@gnosis.pm/safe-ethers-lib';
import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types';
import Web3Adapter from '@gnosis.pm/safe-web3-lib';

export default function useSafe ({ safeAddress }: { safeAddress: string }) {

  const [safe, setSafe] = useState<Safe | null>(null);
  const { account, connector, library } = useWeb3React();

  async function loadSafe () {
    const provider = await connector!.getProvider();
    const signer = await library.getSigner(account);
    // const ethAdapterOwner1 = new Web3Adapter({
    //   web3: provider,
    //   signerAddress: await signer.getAddress()
    // });
    const ethAdapterOwner1 = new EthersAdapter({
      ethers,
      signer
    });
    const _safe = await Safe.create({ ethAdapter: ethAdapterOwner1, safeAddress });
    return _safe;
  }

  useEffect(() => {
    if (safeAddress && account && connector) {
      loadSafe().then(setSafe);
    }
  }, [safeAddress, account, connector]);

  return safe;
}
