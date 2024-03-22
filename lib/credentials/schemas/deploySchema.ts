import { log } from '@charmverse/core/log';
import { SchemaRegistry, getSchemaUID } from '@ethereum-attestation-service/eas-sdk';
import { arbitrum, optimismSepolia } from 'viem/chains';

import { prettyPrint } from 'lib/utils/strings';

import type { EasSchemaChain } from '../connectors';
import { getEasConnector, getOnChainSchemaUrl } from '../connectors';
import { getCharmverseSigner } from '../getCharmverseSigner';

import { allSchemaDefinitions } from './index';

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

async function deploySchema({ schema, chainId }: { schema: string; chainId: EasSchemaChain }) {
  const connector = getEasConnector(chainId);

  const schemaRegistry = new SchemaRegistry(connector.schemaRegistryContract);

  const signer = getCharmverseSigner({ chainId });

  const signerAddress = await signer.getAddress();

  if (signerAddress !== '0x8Bc704386DCE0C4f004194684AdC44Edf6e85f07') {
    throw new Error('Schema must be deployed with CharmVerse Credentials Wallet');
  }

  schemaRegistry.connect(signer);

  const nonce = (await signer.provider?.getTransactionCount(signerAddress)) ?? 0;

  const populatedTx = await schemaRegistry.contract.populateTransaction.register(schema, NULL_ADDRESS, true, {
    nonce: nonce + 1
  });

  await (await signer.sendTransaction(populatedTx)).wait();

  // SchemaUID is deterministic
  const schemaUid = getSchemaUID(schema, NULL_ADDRESS, true);

  const schemaUrl = getOnChainSchemaUrl({ chainId, schemaId: schemaUid });

  log.info(`Schema ${schema} deployed at ${schemaUrl}`);
}

async function deployAllSchemas({ chainId }: { chainId: EasSchemaChain }) {
  for (const schemaDefinition of allSchemaDefinitions) {
    log.info(`Deploying schema ${prettyPrint(schemaDefinition)}...`);
    await deploySchema({ schema: schemaDefinition, chainId });
  }
}

deployAllSchemas({ chainId: arbitrum.id }).then(log.info);
