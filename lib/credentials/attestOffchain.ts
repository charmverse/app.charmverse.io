import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { AttestationType, CredentialEventType } from '@charmverse/core/prisma-client';
import type {
  AttestationShareablePackageObject,
  SignedOffchainAttestation
} from '@ethereum-attestation-service/eas-sdk';
import { Offchain, createOffchainURL } from '@ethereum-attestation-service/eas-sdk';
import { credentialsWalletPrivateKey } from '@root/config/constants';
import { getChainById } from '@root/connectors/chains';
import { trackUserAction } from '@root/lib/metrics/mixpanel/trackUserAction';
import { isValidChainAddress } from '@root/lib/tokens/validation';
import { Wallet, providers } from 'ethers';
import { v4 as uuid } from 'uuid';

import type { EasSchemaChain } from './connectors';
import { easSchemaChains, getEasConnector } from './connectors';
import { getEasInstance } from './getEasInstance';
import type { PublishedSignedCredential } from './queriesAndMutations';
import { publishSignedCredential } from './queriesAndMutations';
import { saveIssuedCredential } from './saveIssuedCredential';
import { attestationSchemaIds } from './schemas';
import { encodeAttestation } from './schemas/encodeAttestation';
import type { CredentialData } from './schemas/interfaces';

type AttestationInput<T extends AttestationType = AttestationType> = {
  recipient: string;
  credential: CredentialData<T>;
  signer: Wallet;
  attester: string;
  chainId: EasSchemaChain;
  linkedAttestationUid?: string;
};

async function attestOffchain({
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
      data: encodeAttestation(credential)
    },
    signer
  );
  return signedOffchainAttestation;
}

export type CharmVerseCredentialInput = {
  chainId: EasSchemaChain;
  credential: CredentialData<AttestationType>;
  recipient: string;
};

export type SignedAttestation = {
  sig: SignedOffchainAttestation;
  signer: string;
  verificationUrl: string;
  credentialData: CredentialData<AttestationType>;
  recipient: string;
  timestamp: number;
};

/**
 *  Only the raw offchain signed credential is returned. The call will handle persisting or publishing this signature
 * */
async function signCharmverseAttestation({
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
 */
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

  const schemaId = attestationSchemaIds[credential.type];

  const contentToPublish: Omit<PublishedSignedCredential, 'author' | 'id'> = {
    chainId,
    recipient: signedCredential.recipient,
    content: credential.data,
    timestamp: new Date(signedCredential.timestamp),
    type: credential.type,
    verificationUrl: signedCredential.verificationUrl,
    issuer: signedCredential.signer,
    schemaId,
    sig: JSON.stringify(signedCredential.sig),
    charmverseId: publishedCredentialId
  };

  const published = await publishSignedCredential(contentToPublish);

  await saveIssuedCredential({
    credentialProps: {
      credentialEvent: event,
      credentialTemplateId,
      schemaId: attestationSchemaIds[credential.type],
      userId: recipientUserId,
      proposalId,
      rewardApplicationId
    },
    offchainData: {
      ceramicId: published.id,
      ceramicRecord: published
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
