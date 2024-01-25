import { Web3Provider } from '@ethersproject/providers';
import { providers } from 'ethers';
import { useMemo } from 'react';
import type { Chain, Client, Transport } from 'viem';
import { useWalletClient } from 'wagmi';
import type { WalletClient } from 'wagmi';

// adapter from viem to ethers https://wagmi.sh/react/ethers-adapters
export function walletClientToSigner(walletClient: WalletClient) {
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
    return new providers.FallbackProvider(
      (transport.transports as ReturnType<Transport>[]).map(
        ({ value }) => new providers.JsonRpcProvider(value?.url, network)
      )
    );
  return new providers.JsonRpcProvider(transport.url, network);
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useWeb3Signer({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ chainId });
  const web3Signer = useMemo(() => (walletClient ? walletClientToSigner(walletClient) : undefined), [walletClient]);

  return web3Signer ?? { signer: undefined, provider: undefined };
}
