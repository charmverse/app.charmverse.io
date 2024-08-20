import { EAS } from '@ethereum-attestation-service/eas-sdk';

import type { EasSchemaChain } from './connectors';
import { getEasConnector } from './connectors';

export function getEasInstance(chainId: EasSchemaChain) {
  return new EAS(getEasConnector(chainId).attestationContract);
}
