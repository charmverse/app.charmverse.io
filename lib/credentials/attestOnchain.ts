import { log } from '@charmverse/core/log';
import type { AttestationType } from '@charmverse/core/prisma-client';
import { getChainById } from 'connectors/chains';
import { Wallet, providers } from 'ethers';
import { v4 as uuid } from 'uuid';
import { optimism, optimismSepolia } from 'viem/chains';
import { getAddress } from 'viem/utils';

import { credentialsWalletPrivateKey } from 'config/constants';
import { conditionalPlural, prettyPrint } from 'lib/utils/strings';

import { getEasInstance, type EasSchemaChain } from './connectors';
import { attestationSchemaIds, encodeAttestion, type CredentialDataInput } from './schemas';
import type { ProposalCredential } from './schemas/proposal';

export type OnChainAttestationInput<T extends AttestationType = AttestationType> = {
  chainId: EasSchemaChain;
  credentialInputs: { recipient: string; data: CredentialDataInput<T> };
  type: T;
};

export async function attestOnchain({ credentialInputs, type, chainId }: OnChainAttestationInput): Promise<any> {
  const schemaId = attestationSchemaIds[type];
  const rpcUrl = getChainById(chainId)?.rpcUrls[0];

  const provider = new providers.JsonRpcProvider(rpcUrl, chainId);

  const wallet = new Wallet(credentialsWalletPrivateKey as string, provider);

  const eas = getEasInstance(chainId);

  eas.connect(wallet);

  const attestation = await eas.attest({
    schema: schemaId,
    data: { recipient: credentialInputs.recipient, data: encodeAttestion({ type, data: credentialInputs.data }) }
  });

  log.info(`Issued ${type} credential on chain ${chainId}`);

  return attestation;
}

export type OnChainMultiAttestationInput<T extends AttestationType = AttestationType> = Omit<
  OnChainAttestationInput<T>,
  'credentialInputs'
> & {
  credentialInputs: { recipient: string; data: CredentialDataInput<T> }[];
};

export async function multiAttestOnchain({
  credentialInputs,
  type,
  chainId
}: OnChainMultiAttestationInput): Promise<any> {
  const schemaId = attestationSchemaIds[type];
  const rpcUrl = getChainById(chainId)?.rpcUrls[0];

  const provider = new providers.JsonRpcProvider(rpcUrl, chainId);

  const wallet = new Wallet(credentialsWalletPrivateKey as string, provider);

  const eas = getEasInstance(chainId);

  eas.connect(wallet);

  const attestations = await eas.multiAttest([
    {
      data: credentialInputs.map(({ data, recipient }) => ({
        data: encodeAttestion({ type, data }),
        recipient: getAddress(recipient)
      })),
      schema: schemaId
    }
  ]);

  log.info(
    `Issued ${credentialInputs.length} ${type} ${conditionalPlural({
      count: credentialInputs.length,
      word: 'credential'
    })} on chain ${chainId}`
  );

  return attestations;
}

// These code snippets provide a quick test to check we can issue credentials onchain ----------

// const recipient = '0x9b56c451f593e1BF5E458A3ecaDfD3Ef17A36998';

// function generateInputs(amount: number) {
//   const inputs: { recipient: string; data: ProposalCredential }[] = [];

//   for (let i = 0; i < amount; i++) {
//     inputs.push({
//       recipient,
//       data: {
//         Description: 'test',
//         Name: 'test',
//         Organization: 'test',
//         Event: 'test',
//         URL: `test-${uuid()}`
//       }
//     });
//   }
//   return inputs;
// }

// attestOnchain({
//   type: 'proposal',
//   chainId: optimism.id,
//   credentialInputs: generateInputs(1)[0]
// }).then((result) => {
//   console.log('--- done ----');
//   prettyPrint(result);
// });
