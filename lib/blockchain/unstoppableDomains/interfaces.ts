export type ProofParams = {
  address: string;
  chainId: `Chain ID: ${string}`;
  chainName: string;
  domain: string;
  // Stringified milliseconds epoch
  issuedAt: string;
  nonce: string;
  statement: string;
  // The value of the unstoppable domain
  uri: `uns:${string}`;
  version: string;
};
export type ProofContent = {
  message: string;
  signature: string;
  template: {
    params: ProofParams;
  };
  type: 'hybrid';
};

// Value of signature returned by uauth popup
export type UnstoppableDomainsAuthSig = {
  accessToken: string;
  expiresAt: number;
  idToken: {
    amr: ['swk', `v1.sign.ethereum.${string}`];
    iss: 'https://auth.unstoppabledomains.com/';
    proof: Record<string, ProofContent>;
    wallet_address: string;
  };
};
