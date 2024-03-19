import { log } from '@charmverse/core/log';
import type { AttestationType } from '@charmverse/core/prisma-client';
import type { Signer } from 'ethers';
import { getAddress } from 'viem/utils';

import { conditionalPlural } from 'lib/utils/strings';

import type { OnChainAttestationInput } from './attestOnchain';
import { getEasInstance } from './connectors';
import { getCharmverseSigner } from './getCharmverseSigner';
import { attestationSchemaIds, encodeAttestion, type CredentialDataInput } from './schemas';

export type OnChainMultiAttestationInput<T extends AttestationType = AttestationType> = Omit<
  OnChainAttestationInput<T>,
  'credentialInputs'
> & {
  credentialInputs: { recipient: string; data: CredentialDataInput<T> }[];
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
}: OnChainMultiAttestationInput & { signer?: Signer }): Promise<string[]> {
  const schemaId = attestationSchemaIds[type];

  const easSigner = signer || getCharmverseSigner({ chainId });

  const eas = getEasInstance(chainId);

  eas.connect(easSigner);

  const attestations = await eas
    .multiAttest([
      {
        data: credentialInputs.map(({ data, recipient }) => ({
          data: encodeAttestion({ type, data }),
          recipient: getAddress(recipient)
        })),
        schema: schemaId
      }
    ])
    .then((tx) => tx.wait());

  log.info(
    `Issued ${credentialInputs.length} ${type} ${conditionalPlural({
      count: credentialInputs.length,
      word: 'credential'
    })} on chain ${chainId}`
  );

  return attestations;
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
