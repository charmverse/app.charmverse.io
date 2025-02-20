import { DelegateV2 } from '@delegatexyz/sdk';
import { getChainById } from '@packages/connectors/chains';
import { http } from 'viem';

// Delegate.xyz is a service that allows users to delegate power to another wallet address. https://delegate.xyz/
function getClient(rpcUrl: string) {
  return new DelegateV2(http(rpcUrl));
}

function getClientByChain(chainId: number) {
  const config = getChainById(chainId);
  if (!config) {
    throw new Error(`Chain with id ${chainId} not found`);
  }
  return getClient(config.rpcUrls[0]);
}

// retrieve the delegations attributed to a given address
export async function getIncomingDelegations(chainId: number, address: `0x${string}`) {
  const client = getClientByChain(chainId);
  return client.getIncomingDelegations(address);
}
