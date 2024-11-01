import env from '@beam-australia/react-env';
import type { Address } from 'viem';

export function getScoutProtocolAddress(): Address {
  return (env('REACT_APP_SCOUTPROTOCOL_CONTRACT_ADDRESS') ||
    process.env.REACT_APP_SCOUTPROTOCOL_CONTRACT_ADDRESS) as Address;
}
