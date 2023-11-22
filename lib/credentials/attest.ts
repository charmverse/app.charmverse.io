import { InvalidInputError } from '@charmverse/core/dist/cjs/errors';
import type { SignedOffchainAttestation } from '@ethereum-attestation-service/eas-sdk';
import type { Signer } from 'ethers';

import { isValidChainAddress } from 'lib/tokens/validation';

import type { EasSchemaChain } from './connectors';
import { easSchemaChains, getEasConnector } from './connectors';
import { encodeAttestion, type CredentialData, type CredentialType } from './schemas';

type AttestationInput<T extends CredentialType = CredentialType> = {
  recipient: string;
  type: T;
  credential: CredentialData<T>;
  signer: Signer;
  attester: string;
  chainId: EasSchemaChain;
};

export async function attestOffchain({
  credential,
  recipient,
  attester,
  chainId,
  signer
}: AttestationInput): Promise<SignedOffchainAttestation> {
  if (!signer) {
    throw new InvalidInputError(`Signer is required to attest`);
  } else if (!isValidChainAddress(recipient) || !isValidChainAddress(attester)) {
    throw new InvalidInputError(`Invalid address`);
  } else if (!easSchemaChains.includes(chainId)) {
    throw new InvalidInputError(`Unsupported chainId`);
  }

  const eas = getEasConnector(chainId);

  eas.connect(signer as any);

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
      schema: '0xc59265615401143689cbfe73046a922c975c99d97e4c248070435b1104b2dea7',
      refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
      data: encodeAttestion(credential)
    },
    signer as any
  );
  return signedOffchainAttestation;
}
