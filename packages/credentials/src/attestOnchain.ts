import { log } from '@charmverse/core/log';
import type { CredentialEventType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getChainById } from '@packages/blockchain/connectors/chains';
import { credentialsWalletPrivateKey } from '@packages/utils/constants';
import { getCurrentGasPrice } from '@packages/lib/blockchain/getCurrentGasPrice';
import { getEthersProvider } from '@packages/lib/blockchain/getEthersProvider';
import { Wallet } from 'ethers';
import { zeroAddress } from 'viem';

import type { EasSchemaChain } from './connectors';
import { getEasInstance } from './getEasInstance';
import type { ExtendedAttestationType, CredentialDataInput } from './schemas';
import { attestationSchemaIds, encodeAttestation } from './schemas';

export type OnChainAttestationInput<T extends ExtendedAttestationType = ExtendedAttestationType> = {
  chainId: EasSchemaChain;
  credentialInputs: { recipient: string | null; data: CredentialDataInput<T> };
  type: T;
};

export async function attestOnchain<T extends ExtendedAttestationType = ExtendedAttestationType>({
  credentialInputs,
  type,
  chainId
}: OnChainAttestationInput<T>): Promise<string> {
  const schemaId = attestationSchemaIds[type];
  const rpcUrl = getChainById(chainId)?.rpcUrls[0] as string;

  const provider = getEthersProvider({ rpcUrl });

  if (!credentialsWalletPrivateKey) {
    throw new Error('Skip creating attestation. Missing env: CREDENTIAL_WALLET_KEY');
  }

  const wallet = new Wallet(credentialsWalletPrivateKey as string, provider);

  const eas = getEasInstance(chainId);

  const currentGasPrice = await getCurrentGasPrice({ chainId });

  eas.connect(wallet);

  const attestationUid = await eas
    .attest(
      {
        schema: schemaId,
        data: {
          recipient: credentialInputs.recipient ?? zeroAddress,
          data: encodeAttestation({ type, data: credentialInputs.data })
        }
      },
      { gasPrice: currentGasPrice }
    )
    .then((tx) => tx.wait());

  log.info(`Issued ${type} credential on chain ${chainId} with uid: ${attestationUid}`);

  return attestationUid;
}

export type OnChainAttestationInputWithMetadata<T extends ExtendedAttestationType = ExtendedAttestationType> = {
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
