import { Web3Provider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { useMemo } from 'react';
import type { Account, Chain, Client, Transport } from 'viem';

import { useWalletClient } from 'hooks/wagmi';

// adapter from viem to ethers https://wagmi.sh/react/ethers-adapters
export function walletClientToSigner(walletClient: { account: Account; chain: Chain; transport: any }) {
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
  const web3Signer = useMemo(() => (walletClient ? walletClientToSigner(walletClient) : undefined), [walletClient]);

  return web3Signer ?? { signer: undefined, provider: undefined };
}
