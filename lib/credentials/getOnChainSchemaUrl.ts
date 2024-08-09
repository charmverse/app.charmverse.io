import { getSchemaUID } from '@ethereum-attestation-service/eas-sdk';

import { easConnectors } from './connectors';
import type { EasSchemaChain } from './connectors';
import { NULL_ADDRESS } from './constants';
import type { ExternalCredentialChain } from './external/schemas';

export function getOnChainSchemaUrl({
  chainId,
  schema
}: {
  chainId: EasSchemaChain | ExternalCredentialChain;
  schema: string;
}) {
  return `${easConnectors[chainId].attestationExplorerUrl}/schema/view/${
    schema.startsWith('0x') ? schema : getSchemaUID(schema, NULL_ADDRESS, true)
  }`;
}
