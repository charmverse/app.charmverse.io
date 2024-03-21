import { log } from '@charmverse/core/log';
import type { CredentialEventType, AttestationType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getChainById } from 'connectors/chains';
import { Wallet, providers } from 'ethers';
import { getAddress } from 'viem/utils';

import { credentialsWalletPrivateKey } from 'config/constants';
import { conditionalPlural } from 'lib/utils/strings';

import { getEasInstance, type EasSchemaChain } from './connectors';
import { attestationSchemaIds, encodeAttestation, type CredentialDataInput } from './schemas';

export type OnChainAttestationInput<T extends AttestationType = AttestationType> = {
  chainId: EasSchemaChain;
  credentialInputs: { recipient: string; data: CredentialDataInput<T> };
  type: T;
};

async function attestOnchain({ credentialInputs, type, chainId }: OnChainAttestationInput): Promise<string> {
  const schemaId = attestationSchemaIds[type];
  const rpcUrl = getChainById(chainId)?.rpcUrls[0];

  const provider = new providers.JsonRpcProvider(rpcUrl, chainId);

  const wallet = new Wallet(credentialsWalletPrivateKey as string, provider);

  const eas = getEasInstance(chainId);

  eas.connect(wallet);

  const attestationUid = await eas
    .attest({
      schema: schemaId,
      data: { recipient: credentialInputs.recipient, data: encodeAttestation({ type, data: credentialInputs.data }) }
    })
    .then((tx) => tx.wait());

  log.info(`Issued ${type} credential on chain ${chainId}`);

  return attestationUid;
}

export type OnChainAttestationInputWithMetadata<T extends AttestationType = AttestationType> = {
  credential: OnChainAttestationInput<T>;
  credentialMetadata: {
    event: CredentialEventType;
    proposalId?: string;
    submissionId?: string;
    userId?: string;
    credentialTemplateId?: string;
  };
};

export async function attestOnChainAndRecordCredential({
  credential,
  credentialMetadata
}: OnChainAttestationInputWithMetadata) {
  const attestationUid = await attestOnchain(credential);

  await prisma.issuedCredential.create({
    data: {
      onchainAttestationId: attestationUid,
      onchainChainId: credential.chainId,
      credentialEvent: credentialMetadata.event,
      credentialTemplate: { connect: { id: credentialMetadata.credentialTemplateId } },
      user: { connect: { id: credentialMetadata.userId } },
      schemaId: attestationSchemaIds[credential.type],
      rewardApplication: credentialMetadata.submissionId
        ? { connect: { id: credentialMetadata.submissionId } }
        : undefined,
      proposal: credentialMetadata.proposalId ? { connect: { id: credentialMetadata.proposalId } } : undefined
    }
  });
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
        data: encodeAttestation({ type, data }),
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

// attestOnchain({
//   type: 'proposal',
//   chainId: optimismSepolia.id,
//   credentialInputs: generateInputs(1)[0],
//   credentialMetadata: {
//     event: 'proposal_approved',
//     userId: '0b2fef6b-1a14-44b1-a0e0-f562f30f4113',
//     proposalId: '38f9631e-9189-48ec-8fd6-09ff61e7c94e',
//     credentialTemplateId: 'f3bea59d-3258-4512-b169-45256ea9e963'
//   }
// }).then((result) => {
//   console.log('--- done ----', result);
// });
