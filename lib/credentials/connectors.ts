import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { optimism } from 'viem/chains';

export const easSchemaChains = [optimism.id] as const;

export type EasSchemaChain = (typeof easSchemaChains)[number];

type EASConnector = {
  attestationContract: string;
  schemaRegistryContract: string;
  attestationScannerUrl: string;
};

export const easConnectors: Record<EasSchemaChain, EASConnector> = {
  10: {
    attestationContract: '0x4200000000000000000000000000000000000021',
    schemaRegistryContract: '0x4200000000000000000000000000000000000020',
    attestationScannerUrl: 'https://optimistic.etherscan.io/tx/'
  }
};

export function getEasConnector(chainId: EasSchemaChain) {
  return new EAS(easConnectors[chainId].attestationContract);
}
