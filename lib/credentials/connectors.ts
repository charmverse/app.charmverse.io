import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { arbitrum, base, optimism, optimismSepolia } from 'viem/chains';

import type { ExternalCredentialChain } from './external/schemas';

export const easSchemaChains = [optimism.id, optimismSepolia.id] as const;

export const defaultCredentialChain = easSchemaChains[0];

export type EasSchemaChain = (typeof easSchemaChains)[number];

type EASConnector = {
  attestationContract: string;
  schemaRegistryContract: string;
  attestationExplorerUrl: string;
};

// See https://github.com/ethereum-attestation-service/eas-contracts
export const easConnectors: Record<EasSchemaChain | ExternalCredentialChain, EASConnector> = {
  [optimism.id]: {
    attestationContract: '0x4200000000000000000000000000000000000021',
    schemaRegistryContract: '0x4200000000000000000000000000000000000020',
    attestationExplorerUrl: 'https://optimism.easscan.org'
  },
  [optimismSepolia.id]: {
    attestationContract: '0x4200000000000000000000000000000000000021',
    schemaRegistryContract: '0x4200000000000000000000000000000000000020',
    attestationExplorerUrl: 'https://optimism-sepolia.easscan.org'
  },
  [arbitrum.id]: {
    attestationContract: '0xbd75f629a22dc1ced33dda0b68c546a1c035c458',
    schemaRegistryContract: '0xa310da9c5b885e7fb3fba9d66e9ba6df512b78eb',
    attestationExplorerUrl: 'https://arbitrum.easscan.org'
  },
  [base.id]: {
    attestationContract: '0x4200000000000000000000000000000000000021',
    schemaRegistryContract: '0x4200000000000000000000000000000000000020',
    attestationExplorerUrl: 'https://base.easscan.org'
  }
};

export function getOnChainAttestationUrl({
  chainId,
  attestationId
}: {
  chainId: EasSchemaChain | ExternalCredentialChain;
  attestationId: string;
}) {
  return `${easConnectors[chainId].attestationExplorerUrl}/attestation/view/${attestationId}`;
}

export function getOnChainSchemaUrl({
  chainId,
  schemaId
}: {
  chainId: EasSchemaChain | ExternalCredentialChain;
  schemaId: string;
}) {
  return `${easConnectors[chainId].attestationExplorerUrl}/schema/view/${schemaId}`;
}

export function getEasConnector(chainId: EasSchemaChain) {
  return easConnectors[chainId];
}

export function getEasInstance(chainId: EasSchemaChain) {
  return new EAS(getEasConnector(chainId).attestationContract);
}
