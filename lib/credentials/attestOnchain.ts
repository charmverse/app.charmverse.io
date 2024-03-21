import { log } from '@charmverse/core/log';
import type { AttestationType, CredentialEventType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getChainById } from 'connectors/chains';
import { Wallet, providers } from 'ethers';

import { credentialsWalletPrivateKey } from 'config/constants';

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
