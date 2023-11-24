import { InvalidInputError } from '@charmverse/core/errors';
import type {
  AttestationShareablePackageObject,
  SignedOffchainAttestation
} from '@ethereum-attestation-service/eas-sdk';
import { createOffchainURL } from '@ethereum-attestation-service/eas-sdk';
import type { SignerOrProvider } from '@ethereum-attestation-service/eas-sdk/dist/transaction';
import { getChainById } from 'connectors/chains';
import { JsonRpcProvider, Wallet } from 'ethers';

import { credentialsWalletPrivateKey } from 'config/constants';
import { getENSName } from 'lib/blockchain';
import { isValidChainAddress } from 'lib/tokens/validation';

import type { EasSchemaChain } from './connectors';
import { easSchemaChains, getEasConnector, getEasInstance } from './connectors';
import { encodeAttestion, type CredentialData, type CredentialType, getAttestationSchemaId } from './schemas';

type AttestationInput<T extends CredentialType = CredentialType> = {
  recipient: string;
  credential: CredentialData<T>;
  signer: SignerOrProvider;
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

  eas.connect(signer);
  const offchain = await eas.getOffchain();
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
    signer as any
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
  const provider = new JsonRpcProvider(getChainById(chainId)?.rpcUrls[0] as string, chainId);

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

function getOffchainUrl({ chainId, pkg }: { pkg: AttestationShareablePackageObject; chainId: EasSchemaChain }) {
  return `${getEasConnector(chainId).attestationExplorerUrl}${createOffchainURL(pkg)}`;
}
