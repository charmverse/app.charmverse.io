import fs from 'node:fs/promises';
import path from 'node:path';

import { SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import { getChainById } from 'connectors/chains';
import type { Chain } from 'viem';
import { createPublicClient, http } from 'viem';
import { arbitrum, base, optimism } from 'viem/chains';

import { clientToProvider } from 'hooks/useWeb3Signer';
import { typedKeys } from 'lib/utilities/objects';

import type { EasSchemaChain } from '../connectors';
import { easConnectors, getOnChainSchemaUrl } from '../connectors';

export const externalCredentialChains = [optimism.id, base.id, arbitrum.id] as const;

export type ExternalCredentialChain = (typeof externalCredentialChains)[number];

/**
 * Utility for configuration relating to the schema
 */
type SchemaParams = {
  schemaId: string;
  issuers: string[];
  title: string;
};

// Optimism schemas ------------------
// https://optimism.easscan.org/schema/view/0xfdcfdad2dbe7489e0ce56b260348b7f14e8365a8a325aef9834818c00d46b31b
const optimismRetroPgfBadgeHolderSchema: SchemaParams = {
  schemaId: '0xfdcfdad2dbe7489e0ce56b260348b7f14e8365a8a325aef9834818c00d46b31b',
  issuers: ['0x621477dBA416E12df7FF0d48E14c4D20DC85D7D9'],
  title: 'RetroPGF Badgeholder'
};

// https://optimism.easscan.org/schema/view/0x3743be2afa818ee40304516c153427be55931f238d961af5d98653a93192cdb3
const optimismRetroPgfContributionSchema: SchemaParams = {
  schemaId: '0x3743be2afa818ee40304516c153427be55931f238d961af5d98653a93192cdb3',
  issuers: ['0x621477dBA416E12df7FF0d48E14c4D20DC85D7D9'],
  title: 'RetroPGF Contribution'
};

// Base schemas ----------------------
// https://base.easscan.org/schema/view/0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9
const baseVerifiedAccountSchema: SchemaParams = {
  schemaId: '0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9',
  issuers: ['0x357458739F90461b99789350868CD7CF330Dd7EE'],
  title: 'Verified Account'
};

// Arbitrum schemas ------------------
// https://arbitrum.easscan.org/schema/view/0x951fa7e07d6e852eb4535331db373786f5ab7249bb31d94cc4bd05250ebb6500
const arbitrumDevfolioQuadraticVotingAttestationSchema: SchemaParams = {
  schemaId: '0x951fa7e07d6e852eb4535331db373786f5ab7249bb31d94cc4bd05250ebb6500',
  issuers: ['0x8AdCfB84d861F510Ad01C24cf459abE1515BB9e8'],
  title: 'Devfolio Quadratic Voting Attestation'
};

// https://arbitrum.easscan.org/schema/view/0x364a59df1d48d4b6c0f8f0c1176504b252bce5ce57e0d1ca75b1bf70c2f0ec14
const arbitrumDevfolioOnchainCredentialAttestationSchema: SchemaParams = {
  schemaId: '0x364a59df1d48d4b6c0f8f0c1176504b252bce5ce57e0d1ca75b1bf70c2f0ec14',
  issuers: ['0x3Ce7b2b2a9F3C27aFa6EC511679f606412fb497b', ' 0xB605589815E8C9771e75BD35A629642F9ed102A1'],
  title: 'Devfolio Onchain Credential Attestation'
};

// https://arbitrum.easscan.org/schema/view/0x6c8eb2f9520c7bd673bf4bb8ea475114e86a01e80a5d167ebc65a0baea122f9c
const arbitrumCheerSchema: SchemaParams = {
  schemaId: '0x6c8eb2f9520c7bd673bf4bb8ea475114e86a01e80a5d167ebc65a0baea122f9c',
  issuers: ['0x3Ce7b2b2a9F3C27aFa6EC511679f606412fb497b', '0xB605589815E8C9771e75BD35A629642F9ed102A1'],
  title: 'Cheer'
};

export const trackedSchemas: Record<ExternalCredentialChain, SchemaParams[]> = {
  [optimism.id]: [optimismRetroPgfBadgeHolderSchema, optimismRetroPgfContributionSchema],
  [base.id]: [baseVerifiedAccountSchema],
  [arbitrum.id]: [
    arbitrumDevfolioQuadraticVotingAttestationSchema,
    arbitrumDevfolioOnchainCredentialAttestationSchema,
    arbitrumCheerSchema
  ]
};

/**
 *
 * @param input string rpgfRound,address referredBy,string referredMethod
 */
function mapSchemaStringToObject(input: string): Record<string, string> {
  const object: Record<string, string> = {};

  // Splitting the input string by commas to get each 'type variableName' pair
  const pairs = input.split(',');

  pairs.forEach((pair) => {
    // Splitting each pair by space to separate type and variable name
    const [type, variableName] = pair.trim().split(' ');

    // Adding to the object
    object[variableName] = type;
  });

  return object;
}

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

  const schemaDump: Record<EasSchemaChain | ExternalCredentialChain, (SchemaParams & { schema: any; url: string })[]> =
    {
      [optimism.id]: [],
      [base.id]: [],
      [arbitrum.id]: []
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
