import { Web3Provider } from '@ethersproject/providers';
import { ethers, BrowserProvider } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import type { Account, Chain, Client, Transport } from 'viem';

import { useWalletClient } from 'hooks/wagmi';

// adapter from viem to ethers https://wagmi.sh/react/ethers-adapters
async function walletClientToSigner(walletClient: { account: Account; chain: Chain; transport: any }) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  };
  const provider = new BrowserProvider(transport, network);
  const signer = await provider.getSigner(account.address);
  return { provider, signer };
}

// adapter from viem to ethers https://wagmi.sh/react/ethers-adapters
export function walletClientToLegacyProvider(walletClient: { account: Account; chain: Chain; transport: any }) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  };
  const provider = new Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);
  return { provider, signer };
}

export function clientToProvider(client: Client<Transport, Chain>) {
  const { chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  };
  if (transport.type === 'fallback')
    return new ethers.FallbackProvider(
      (transport.transports as ReturnType<Transport>[]).map(
        ({ value }) => new ethers.JsonRpcProvider(value?.url, network)
      )
    );
  return new ethers.JsonRpcProvider(transport.url, network);
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useWeb3Signer({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ chainId });
  const [web3Signer, setWeb3Signer] = useState<{ signer: any; provider: any } | undefined>(undefined);

  const legacySigner = useMemo(() => {
    if (!walletClient) return undefined;
    return walletClientToLegacyProvider(walletClient);
  }, [walletClient]);

  useEffect(() => {
    if (walletClient) {
      walletClientToSigner(walletClient).then(setWeb3Signer);
    } else {
      setWeb3Signer(undefined);
    }
  }, [walletClient]);

  return {
    signer: web3Signer?.signer,
    provider: web3Signer?.provider,
    legacyProvider: legacySigner?.provider
  };
}
