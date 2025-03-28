import { arbitrum, base, optimism, optimismSepolia, sepolia } from 'viem/chains';

import type { ExternalCredentialChain } from './external/schemas';

export const easSchemaMainnetChains = [optimism, arbitrum] as const;
export const easSchemaTestnetChains = [sepolia, optimismSepolia] as const;

export type EasSchemaChain =
  | (typeof easSchemaMainnetChains)[number]['id']
  | (typeof easSchemaTestnetChains)[number]['id'];

export const easSchemaChains = [...easSchemaMainnetChains, ...easSchemaTestnetChains].map(
  (c) => c.id
) as EasSchemaChain[];

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
  [arbitrum.id]: {
    attestationContract: '0xbd75f629a22dc1ced33dda0b68c546a1c035c458',
    schemaRegistryContract: '0xa310da9c5b885e7fb3fba9d66e9ba6df512b78eb',
    attestationExplorerUrl: 'https://arbitrum.easscan.org'
  },
  [base.id]: {
    attestationContract: '0x4200000000000000000000000000000000000021',
    schemaRegistryContract: '0x4200000000000000000000000000000000000020',
    attestationExplorerUrl: 'https://base.easscan.org'
  },
  [sepolia.id]: {
    attestationContract: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
    schemaRegistryContract: '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0',
    attestationExplorerUrl: 'https://sepolia.easscan.org'
  },
  [optimismSepolia.id]: {
    attestationContract: '0x4200000000000000000000000000000000000021',
    schemaRegistryContract: '0x4200000000000000000000000000000000000020',
    attestationExplorerUrl: 'https://optimism-sepolia.easscan.org'
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

export function getEasConnector(chainId: EasSchemaChain) {
  return easConnectors[chainId];
}
