import { getWagmiConfig } from '@packages/blockchain/connectors/config';
import {
  useAccount as useAccountWagmi,
  useConnect as useConnectWagmi,
  useEnsName as useEnsNameWagmi,
  useSignMessage as useSignMessageWagmi,
  useSwitchChain as useSwitchChainWagmi,
  useWalletClient as useWalletClientWagmi
} from 'wagmi';

export function useAccount() {
  return useAccountWagmi({ config: getWagmiConfig() });
}

export function useConnect() {
  return useConnectWagmi({ config: getWagmiConfig() });
}

export function useEnsName({ address }: { address: `0x${string}` | undefined }) {
  return useEnsNameWagmi({ address, config: getWagmiConfig() });
}

export function useSignMessage() {
  return useSignMessageWagmi({ config: getWagmiConfig() });
}

export function useSwitchChain() {
  return useSwitchChainWagmi({ config: getWagmiConfig() });
}

export function useWalletClient({ chainId }: { chainId?: number } = {}) {
  return useWalletClientWagmi({ chainId, config: getWagmiConfig() });
}
