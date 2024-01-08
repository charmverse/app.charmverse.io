import { InvalidInputError } from '@charmverse/core/errors';
import type {
  AttestationShareablePackageObject,
  SignedOffchainAttestation
} from '@ethereum-attestation-service/eas-sdk';
import { Offchain, createOffchainURL } from '@ethereum-attestation-service/eas-sdk';
import type { SignerOrProvider } from '@ethereum-attestation-service/eas-sdk/dist/transaction';
import { getChainById } from 'connectors/chains';
import { Wallet, providers, Signer, VoidSigner } from 'ethers';

import { credentialsWalletPrivateKey } from 'config/constants';
import { getENSName } from 'lib/blockchain';
import { isValidChainAddress } from 'lib/tokens/validation';
import { prettyPrint } from 'lib/utilities/strings';

import type { PublishedSignedCredential } from './config/queriesAndMutations';
import { publishSignedCredential } from './config/queriesAndMutations';
import type { EasSchemaChain } from './connectors';
import { easSchemaChains, getEasConnector, getEasInstance } from './connectors';
import { EthersV5toV6WalletAdapter } from './ethersAdapter';
import { encodeAttestion, type CredentialData, type CredentialType, getAttestationSchemaId } from './schemas';

type AttestationInput<T extends CredentialType = CredentialType> = {
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
      schema: getAttestationSchemaId({ chainId, credentialType: credential.type }),
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

export type SignedCredential = {
  sig: SignedOffchainAttestation;
  signer: {
    wallet: string;
    ensname: string | null;
  };
  verificationUrl: string;
  credentialData: CredentialData;
  recipient: string;
  timestamp: number;
};

export async function signCharmverseCredential({
  chainId,
  credential,
  recipient
}: CharmVerseCredentialInput): Promise<SignedCredential> {
  const provider = new providers.JsonRpcProvider(getChainById(chainId)?.rpcUrls[0] as string, chainId);

  const wallet = new Wallet(credentialsWalletPrivateKey, provider);

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

  const signerEnsName = await getENSName(wallet.address);

  const signedCredential: SignedCredential = {
    sig: signature,
    signer: {
      wallet: wallet.address,
      ensname: signerEnsName
    },
    verificationUrl: offchainCredentialVerificationUrl,
    credentialData: credential,
    recipient,
    timestamp: Number(signature.message.time) * 1000
  };
  return signedCredential;
}

export async function signAndPublishCharmverseCredential({
  chainId,
  credential,
  recipient
}: CharmVerseCredentialInput) {
  const signedCredential = await signCharmverseCredential({ chainId, credential, recipient });

  const contentToPublish: Omit<PublishedSignedCredential, 'author'> = {
    chainId,
    recipient: signedCredential.recipient,
    content: JSON.stringify(credential.data),
    timestamp: signedCredential.timestamp,
    type: credential.type,
    verificationUrl: signedCredential.verificationUrl,
    issuer: signedCredential.signer.wallet,
    schemaId: getAttestationSchemaId({ chainId, credentialType: credential.type }),
    sig: JSON.stringify(signedCredential.sig)
  };

  prettyPrint({ contentToPublish });

  const published = await publishSignedCredential(contentToPublish);

  return published;
}

function getOffchainUrl({ chainId, pkg }: { pkg: AttestationShareablePackageObject; chainId: EasSchemaChain }) {
  return `${getEasConnector(chainId).attestationExplorerUrl}${createOffchainURL(pkg)}`;
}
