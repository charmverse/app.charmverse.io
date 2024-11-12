import env from '@beam-australia/react-env';
import type { Address } from 'viem';
import { baseSepolia } from 'viem/chains';

export function getScoutProtocolAddress(): Address {
  return (env('REACT_APP_SCOUTPROTOCOL_CONTRACT_ADDRESS') ||
    process.env.REACT_APP_SCOUTPROTOCOL_CONTRACT_ADDRESS) as Address;
}

export const scoutProtocolChain = baseSepolia;

export const scoutProtocolChainId = scoutProtocolChain.id;
