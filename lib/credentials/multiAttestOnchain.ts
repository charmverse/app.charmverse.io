/* eslint-disable camelcase */
import type { AttestationType } from '@charmverse/core/prisma-client';
import type { Transaction } from '@ethereum-attestation-service/eas-sdk/dist/transaction';
import type { PopulatedTransaction, Signer } from 'ethers';
import type { Chain } from 'viem';
import { optimism, optimismSepolia } from 'viem/chains';
import { getAddress } from 'viem/utils';

import type { OnChainAttestationInput } from './attestOnchain';
import type { EasSchemaChain } from './connectors';
import { getEasInstance } from './connectors';
import { attestationSchemaIds, encodeAttestion, type CredentialDataInput } from './schemas';

export type OnChainMultiAttestationInput<T extends AttestationType = AttestationType> = Omit<
  OnChainAttestationInput<T>,
  'credentialInputs'
> & {
  credentialInputs: { recipient: string; data: CredentialDataInput<T> }[];
};

const chainMap: Record<EasSchemaChain, Chain> = {
  [optimismSepolia.id]: optimismSepolia,
  [optimism.id]: optimism
};

/**
 * This method can be used on the backend or frontend
 *
 * returns the UIDs of all attestations
 */
export async function multiAttestOnchain({
  credentialInputs,
  type,
  chainId,
  signer
}: OnChainMultiAttestationInput & { signer: Signer }): Promise<Transaction<string[]>> {
  const schemaId = attestationSchemaIds[type];

  const easSigner = signer;

  const eas = getEasInstance(chainId);

  eas.connect(easSigner);

  const attestationTx = await eas.multiAttest([
    {
      data: credentialInputs.map(({ data, recipient }) => ({
        data: encodeAttestion({ type, data }),
        recipient: getAddress(recipient)
      })),
      schema: schemaId
    }
  ]);

  return attestationTx;
}

const ZERO_BIGINT = BigInt(0);
const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

/**
 * This method can be used on the backend or frontend
 *
 * Prepares a transaction which can be broadcast later
 */
export async function prepareOnChainAttestationTransaction({
  credentialInputs,
  type,
  chainId
}: OnChainMultiAttestationInput): Promise<PopulatedTransaction> {
  const schemaId = attestationSchemaIds[type];

  const eas = getEasInstance(chainId);

  const populatedTransaction = await eas.contract.populateTransaction.multiAttest([
    {
      data: credentialInputs.map(({ data, recipient }) => ({
        recipient,
        expirationTime: ZERO_BIGINT,
        revocable: true,
        // We don't currently refer to other attestations
        refUID: ZERO_BYTES32,
        data: encodeAttestion({ type, data }),
        value: ZERO_BIGINT
      })),
      schema: schemaId
    }
  ]);

  return populatedTransaction;
}

// These code snippets provide a quick test to check we can issue credentials onchain ----------

// const recipient = '0x4A29c8fF7D6669618580A68dc691565B07b19e25';

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
//   chainId: optimismSepolia.id,
//   credentialInputs: generateInputs(2),
//   signer: getCharmverseSigner({ chainId: optimismSepolia.id })
// }).then((result) => {
//   console.log('--- done ----', result);
// });
