import { verifyMessage } from 'ethers/lib/utils';
import { SiweMessage } from 'lit-siwe';

import { lowerCaseEqual } from 'lib/utilities/strings';

type ProofParams = {
  address: string;
  chainId: `Chain ID: ${string}`;
  chainName: string;
  domain: string;
  // Stringified milliseconds epoch
  issuedAt: string;
  nonce: string;
  statement: string;
  uri: string;
  version: string;
};
type ProofContent = {
  message: string;
  signature: string;
  template: {
    format: string;
    params: ProofParams;
  };
  type: 'hybrid';
};

// Value of signature returned by uauth popup
export type UnstoppableDomainsAuthSig = {
  accessToken: string;
  expiresAt: number;
  idToken: {
    acr: 'sig';
    amr: ['swk', `v1.sign.ethereum.${string}`];
    at_hash: string;
    aud: [string];
    auth_time: number;
    domain_live: boolean;
    eip4361_message: string;
    eip4361_signature: string;
    exp: number;
    iat: number;
    iss: 'https://auth.unstoppabledomains.com/';
    jti: string;
    nonce: string;
    proof: Record<string, ProofContent>;
    wallet_address: string;
    wallet_type_hint: string;
    __raw: string;
  };
};
export function verifyUnstoppableDomainsSignature(authSig: UnstoppableDomainsAuthSig): boolean {
  const { idToken } = authSig;

  const verificationKey = idToken.amr.find((item) => item.match('v1.sig.ethereum.'));

  if (!verificationKey) {
    return false;
  }

  const address = verificationKey.split('v1.sig.ethereum.')?.[1];

  const proofs = idToken.proof as Record<string, ProofContent>;

  const verificationProof = proofs[verificationKey as any];
  const verificationParams = verificationProof.template.params;

  const chainId = parseInt(verificationParams.chainId.split('Chain ID:')[1].trim());
  const nonce = verificationParams.nonce;
  const issuedAt = new Date(parseInt(verificationParams.issuedAt)).toISOString();

  const payload: Partial<SiweMessage> = {
    address: verificationParams.address,
    chainId,
    // requestId: idToken.sid,
    domain: 'identity.unstoppabledomains.com',
    version: '1',
    nonce,
    issuedAt,
    uri: verificationParams.uri,
    statement: 'I consent to giving access to: openid wallet'
    //    expirationTime: idToken.exp.toString()
  };

  // Try with params direct

  const message = new SiweMessage(payload);

  const body = message.prepareMessage();

  const signatureAddress = verifyMessage(body, verificationProof.signature);
  if (!lowerCaseEqual(signatureAddress, address)) {
    return false;
  }

  return true;
}
