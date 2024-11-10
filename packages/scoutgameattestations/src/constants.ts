import env from '@beam-australia/react-env';
import { baseSepolia } from 'viem/chains';

export const scoutGameAttestationChain = baseSepolia;

export const scoutGameAttestationChainId = scoutGameAttestationChain.id;

export const SCOUTGAME_METADATA_PATH_PREFIX = process.env.SCOUTGAME_METADATA_PATH_PREFIX || 'dev';

// Demo value -- base-sepolia.easscan.org/schema/view/0x5c99a66fb3581cca6e7a53f3e135db2245cdbb612a0846efc802cd4e9cd23818
export function scoutGameUserProfileSchemaUid() {
  return (env('SCOUTPROTOCOL_PROFILE_EAS_SCHEMAID') ||
    process.env.REACT_APP_SCOUTPROTOCOL_PROFILE_EAS_SCHEMAID) as `0x${string}`;
}

// Demo value -- base-sepolia.easscan.org/schema/view/0x99dd83daa6a4f2e818641185dfd3b8c9684838802a682bcdbd88de774f7acbae
export function scoutGameContributionReceiptSchemaUid() {
  return (env('SCOUTPROTOCOL_CONTRIBUTION_RECEIPT_EAS_SCHEMAID') ||
    process.env.REACT_APP_SCOUTPROTOCOL_CONTRIBUTION_RECEIPT_EAS_SCHEMAID) as `0x${string}`;
}

// Address valid for Base Mainnet and Base Sepolia  https://github.com/ethereum-attestation-service/eas-contracts/blob/master/README.md#base-sepolia
export const scoutGameEasAttestationContractAddress = '0x4200000000000000000000000000000000000021';
