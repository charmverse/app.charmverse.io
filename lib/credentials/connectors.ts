import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { optimism } from 'viem/chains';

export const easSchemaChains = [optimism.id] as const;

export const defaultCredentialChain = easSchemaChains[0];

export type EasSchemaChain = (typeof easSchemaChains)[number];

type EASConnector = {
  attestationContract: string;
  schemaRegistryContract: string;
  attestationExplorerUrl: string;
};

export const easConnectors: Record<EasSchemaChain, EASConnector> = {
  10: {
    attestationContract: '0x4200000000000000000000000000000000000021',
    schemaRegistryContract: '0x4200000000000000000000000000000000000020',
    attestationExplorerUrl: 'https://optimism.easscan.org'
  }
};

export function getEasConnector(chainId: EasSchemaChain) {
  return easConnectors[chainId];
}

export function getEasInstance(chainId: EasSchemaChain) {
  return new EAS(getEasConnector(chainId).attestationContract);
}
