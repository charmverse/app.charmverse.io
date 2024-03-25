import fs from 'node:fs/promises';
import path from 'node:path';

import { SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import { getChainById } from 'connectors/chains';
import type { Chain } from 'viem';
import { createPublicClient, http } from 'viem';
import { arbitrum, base, optimism, optimismSepolia, sepolia } from 'viem/chains';

import { clientToProvider } from 'hooks/useWeb3Signer';
import { typedKeys } from 'lib/utils/objects';

import type { EasSchemaChain } from '../connectors';
import { easConnectors, getOnChainSchemaUrl } from '../connectors';

import { trackedSchemas, mapSchemaStringToObject } from './schemas';
import type { TrackedSchemaParams, ExternalCredentialChain } from './schemas';

export async function loadSchema({
  chainId,
  schemaId
}: {
  chainId: ExternalCredentialChain | EasSchemaChain;
  schemaId: string;
}): Promise<{ uid: string; resolver: string; revocable: boolean; schema: any }> {
  const rpcUrl = chainId === arbitrum.id ? 'https://rpc.ankr.com/arbitrum' : getChainById(chainId)?.rpcUrls?.[0];

  const mapping: Record<ExternalCredentialChain | EasSchemaChain, Chain> = {
    [optimism.id]: optimism,
    [sepolia.id]: sepolia,
    [optimismSepolia.id]: optimismSepolia,
    [base.id]: base,
    [arbitrum.id]: arbitrum
  };

  const publicClient = createPublicClient({
    transport: http(rpcUrl),
    chain: mapping[chainId]
  });

  const registryContract = easConnectors[chainId].schemaRegistryContract;

  const registry = new SchemaRegistry(registryContract, { signerOrProvider: clientToProvider(publicClient) });

  const schema = await registry.getSchema({
    uid: schemaId
  });

  return {
    resolver: schema.resolver,
    revocable: schema.revocable,
    schema: mapSchemaStringToObject(schema.schema),
    uid: schema.uid
  };
}

/**
 * Utility to dump all the schemas we are tracking to a file
 */
async function dumpSchemas() {
  const schemaChains = typedKeys(trackedSchemas);

  const schemaDump: Record<
    EasSchemaChain | ExternalCredentialChain,
    (TrackedSchemaParams & { schema: any; url: string })[]
  > = {
    [optimism.id]: [],
    [base.id]: [],
    [arbitrum.id]: [],
    [sepolia.id]: [],
    [optimismSepolia.id]: []
  };

  for (const chainId of schemaChains) {
    const schemaList = await Promise.all(
      trackedSchemas[chainId].map((_schema) =>
        loadSchema({ chainId, schemaId: _schema.schemaId }).then((_loadedSchema) => ({
          ..._schema,
          schema: _loadedSchema.schema,
          url: getOnChainSchemaUrl({ chainId, schemaId: _loadedSchema.uid })
        }))
      )
    );

    schemaDump[chainId] = schemaList;
  }

  const outputPath = path.resolve(`lib/credentials/external/schemas-${Date.now()}.json`);

  await fs.writeFile(outputPath, JSON.stringify(schemaDump, null, 2));
}

// dumpSchemas().then(console.log);
