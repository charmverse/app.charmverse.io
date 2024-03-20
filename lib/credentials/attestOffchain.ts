import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { AttestationType, CredentialEventType } from '@charmverse/core/prisma-client';
import type {
  AttestationShareablePackageObject,
  SignedOffchainAttestation
} from '@ethereum-attestation-service/eas-sdk';
import { Offchain, createOffchainURL } from '@ethereum-attestation-service/eas-sdk';
import { getChainById } from 'connectors/chains';
import { Wallet, providers } from 'ethers';
import { v4 as uuid } from 'uuid';

import { credentialsWalletPrivateKey } from 'config/constants';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { isValidChainAddress } from 'lib/tokens/validation';

import type { EasSchemaChain } from './connectors';
import { easSchemaChains, getEasConnector, getEasInstance } from './connectors';
import type { PublishedSignedCredential } from './queriesAndMutations';
import { publishSignedCredential } from './queriesAndMutations';
import { encodeAttestion, attestationSchemaIds, type CredentialData } from './schemas';

type AttestationInput<T extends AttestationType = AttestationType> = {
  recipient: string;
  credential: CredentialData<T>;
  signer: Wallet;
  attester: string;
  chainId: EasSchemaChain;
  linkedAttestationUid?: string;
};

export async function attestOffchain({
  credential,
  recipient,
  attester,
  chainId,
  signer,
  linkedAttestationUid
}: AttestationInput): Promise<SignedOffchainAttestation> {
  if (!signer) {
    throw new InvalidInputError(`Signer is required to attest`);
  } else if (!isValidChainAddress(recipient) || !isValidChainAddress(attester)) {
    throw new InvalidInputError(`Invalid address`);
  } else if (!easSchemaChains.includes(chainId)) {
    throw new InvalidInputError(`Unsupported chainId`);
  }

  const eas = getEasInstance(chainId);

  // We are currently running on pre v1 EAS in order to maintain ethers v5. In order to bypass contract errors, we need to manually instantiate offchain
  const offchain = new Offchain(
    {
      address: eas.contract.address,
      chainId,
      version: '1'
    },
    1
  );

  // (signer as any).signTypedData = (signer as any)._signTypedData;
  const signedOffchainAttestation = await offchain.signOffchainAttestation(
    {
      recipient: recipient.toLowerCase(),
      // Unix timestamp of when attestation expires. (0 for no expiration)
      expirationTime: BigInt(0),
      // Unix timestamp of current time
      time: BigInt(Math.floor(Date.now() / 1000)),
      revocable: true,
      version: 1,
      nonce: BigInt(0),
      schema: attestationSchemaIds[credential.type],
      refUID: linkedAttestationUid ?? '0x0000000000000000000000000000000000000000000000000000000000000000',
      data: encodeAttestion(credential)
    },
    signer
  );
  return signedOffchainAttestation;
}

export type CharmVerseCredentialInput = {
  chainId: EasSchemaChain;
  credential: CredentialData;
  recipient: string;
};

export type SignedAttestation = {
  sig: SignedOffchainAttestation;
  signer: string;
  verificationUrl: string;
  credentialData: CredentialData;
  recipient: string;
  timestamp: number;
};

/**
 *  Only the raw offchain signed credential is returned. The call will handle persisting or publishing this signature
 * */
export async function signCharmverseAttestation({
  chainId,
  credential,
  recipient
}: CharmVerseCredentialInput): Promise<SignedAttestation> {
  const provider = new providers.JsonRpcProvider(getChainById(chainId)?.rpcUrls[0] as string, chainId);

  const wallet = new Wallet(credentialsWalletPrivateKey as string, provider);

  const signature = await attestOffchain({
    attester: wallet.address,
    recipient,
    chainId,
    signer: wallet,
    credential
  });

  const offchainCredentialVerificationUrl = getOffchainUrl({
    chainId,
    pkg: { sig: signature, signer: wallet.address }
  });

  const signedCredential: SignedAttestation = {
    sig: signature,
    signer: wallet.address,
    verificationUrl: offchainCredentialVerificationUrl,
    credentialData: credential,
    recipient,
    timestamp: Number(signature.message.time) * 1000
  };
  return signedCredential;
}

/**
 * Sign the credential offchain and send to IPFS
 *
 * Only useful for scripts. Prefer signPublishAndRecordCharmverseCredential for production use with existing users
 * */
export async function signAndPublishCharmverseCredential({
  chainId,
  credential,
  recipient
}: CharmVerseCredentialInput) {
  const signedCredential = await signCharmverseAttestation({ chainId, credential, recipient });

  const contentToPublish: Omit<PublishedSignedCredential, 'author' | 'id'> = {
    chainId,
    recipient: signedCredential.recipient,
    content: credential.data,
    timestamp: new Date(signedCredential.timestamp),
    type: credential.type,
    verificationUrl: signedCredential.verificationUrl,
    issuer: signedCredential.signer,
    schemaId: attestationSchemaIds[credential.type],
    sig: JSON.stringify(signedCredential.sig)
  };

  const published = await publishSignedCredential(contentToPublish);

  return published;
}

/**
 * Sign the credential offchain, send to IPFS, record as Issued Credential
 * */
export async function signPublishAndRecordCharmverseCredential({
  chainId,
  credential,
  recipient,
  event,
  recipientUserId,
  pageId,
  proposalId,
  rewardApplicationId,
  credentialTemplateId
}: CharmVerseCredentialInput & {
  event: CredentialEventType;
  recipientUserId: string;
  credentialTemplateId: string;
  pageId: string;
  rewardApplicationId?: string;
  proposalId?: string;
}) {
  const { spaceId } = await prisma.credentialTemplate.findUniqueOrThrow({
    where: {
      id: credentialTemplateId
    },
    select: {
      spaceId: true
    }
  });

  const signedCredential = await signCharmverseAttestation({ chainId, credential, recipient });

  const publishedCredentialId = uuid();

  const contentToPublish: Omit<PublishedSignedCredential, 'author' | 'id'> = {
    chainId,
    recipient: signedCredential.recipient,
    content: credential.data,
    timestamp: new Date(signedCredential.timestamp),
    type: credential.type,
    verificationUrl: signedCredential.verificationUrl,
    issuer: signedCredential.signer,
    schemaId: attestationSchemaIds[credential.type],
    sig: JSON.stringify(signedCredential.sig),
    charmverseId: publishedCredentialId
  };

  const published = await publishSignedCredential(contentToPublish);

  await prisma.issuedCredential.create({
    data: {
      id: publishedCredentialId,
      ceramicId: published.id,
      ceramicRecord: published,
      credentialEvent: event,
      credentialTemplate: { connect: { id: credentialTemplateId } },
      user: { connect: { id: recipientUserId } },
      proposal: proposalId ? { connect: { id: proposalId } } : undefined,
      rewardApplication: rewardApplicationId ? { connect: { id: rewardApplicationId } } : undefined,
      schemaId: attestationSchemaIds[credential.type]
    }
  });

  trackUserAction('credential_issued', {
    userId: recipientUserId,
    spaceId,
    trigger: event,
    credentialTemplateId
  });

  log.info('Issued credential', {
    pageId,
    event,
    proposalId,
    rewardApplicationId,
    userId: recipientUserId,
    credentialTemplateId
  });

  return published;
}

function getOffchainUrl({ chainId, pkg }: { pkg: AttestationShareablePackageObject; chainId: EasSchemaChain }) {
  return `${getEasConnector(chainId).attestationExplorerUrl}${createOffchainURL(pkg)}`;
}
