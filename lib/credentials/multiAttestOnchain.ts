import type { AttestationType } from '@charmverse/core/prisma-client';
import { getChainById } from 'connectors/chains';
import { Wallet, providers } from 'ethers';
import { getAddress } from 'viem/utils';

import { credentialsWalletPrivateKey, isProdEnv } from 'config/constants';
import { addMessageToSQS } from 'lib/aws/SQS';

import { getEasInstance, type EasSchemaChain } from './connectors';
import { attestationSchemaIds, encodeAttestion, type CredentialDataInput } from './schemas';

export type OnChainMultiAttestationInput<T extends AttestationType = AttestationType> = {
  chainId: EasSchemaChain;
  credentialInputs: { recipient: string; data: CredentialDataInput<T> }[];
  type: T;
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

  return attestations;
}

const CREDENTIALS_SQS_QUEUE_NAME = isProdEnv
  ? 'https://sqs.us-east-1.amazonaws.com/310849459438/charmverse-credentials-queue-prd.fifo'
  : 'https://sqs.us-east-1.amazonaws.com/310849459438/charmverse-credentials-queue-stg.fifo';

export type OnChainMultiAttestationInputPayload<T extends AttestationType = AttestationType> =
  OnChainMultiAttestationInput<T> & {
    spaceId: string;
  };

export async function requestOnChainCredentialIssuance(payload: OnChainMultiAttestationInputPayload): Promise<void> {
  await addMessageToSQS(CREDENTIALS_SQS_QUEUE_NAME, JSON.stringify(payload));
}

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

// multiAttestOnchain({
//   type: 'proposal',
//   chainId: optimism.id,
//   credentialInputs: generateInputs(1)
// }).then((result) => {
//   console.log('--- done ----');
//   prettyPrint(result);
// });
