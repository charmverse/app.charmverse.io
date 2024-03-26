import { log } from '@charmverse/core/log';
import { SchemaRegistry, getSchemaUID } from '@ethereum-attestation-service/eas-sdk';
import { getChainById } from 'connectors/chains';
import { optimism } from 'viem/chains';

import type { EasSchemaChain } from '../connectors';
import { easSchemaChains, getEasConnector, getOnChainSchemaUrl } from '../connectors';
import { NULL_ADDRESS } from '../constants';
import { getCharmverseSigner } from '../getCharmverseSigner';

import { externalCredentialSchemaDefinition } from './external';

async function deploySchema({ schema, chainId }: { schema: string; chainId: EasSchemaChain }) {
  const connector = getEasConnector(chainId);

  const schemaRegistry = new SchemaRegistry(connector.schemaRegistryContract);

  const signer = getCharmverseSigner({ chainId });

  const signerAddress = await signer.getAddress();

  if (signerAddress !== '0x8Bc704386DCE0C4f004194684AdC44Edf6e85f07') {
    throw new Error('Schema must be deployed with CharmVerse Credentials Wallet');
  }

  const fullChainName = `${getChainById(chainId)?.chainName} - ${chainId}`;

  schemaRegistry.connect(signer);

  // SchemaUID is deterministic
  const schemaUid = getSchemaUID(schema, NULL_ADDRESS, true);

  const deployedSchema = await schemaRegistry.getSchema({ uid: schemaUid }).catch((err) => {
    log.info(`Schema not found on ${fullChainName}`);
  });

  const schemaUrl = getOnChainSchemaUrl({ chainId, schema: schemaUid });

  if (deployedSchema) {
    log.info(`Schema already exists at ${schemaUrl}`);
  } else {
    log.info('Creating schema');

    await schemaRegistry.register({
      schema,
      resolverAddress: NULL_ADDRESS,
      revocable: true
    });

    log.info(`Schema ${schema} deployed at ${schemaUrl}`);
  }
}

async function deploySchemaAcrossChains({ schema }: { schema: string }) {
  for (const chainId of easSchemaChains) {
    log.info(`Deploying schema...`);
    await deploySchema({ schema, chainId });
  }
}

// deploySchemaAcrossChains({
//   schema: externalCredentialSchemaDefinition
// }).then(log.info);

log.info(
  getOnChainSchemaUrl({
    chainId: optimism.id,
    schema: externalCredentialSchemaDefinition
  })
);
