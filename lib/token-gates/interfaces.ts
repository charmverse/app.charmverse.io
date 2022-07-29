import { Role, Space, TokenGate, TokenGateToRole } from '@prisma/client';
import { AuthSig, Chain } from 'lit-js-sdk';

/**
 * @extraData Contains the tokenGate Id as stringified JSON
 * @orgId The spaceId
 */
export interface LitJwtPayload {
  iss: 'LIT',
  sub: string,
  chain: Chain,
  iat: number,
  exp: number,
  baseUrl: 'https://app.charmverse.io',
  path: '0.5762676518678522',
  orgId: '73ff04b5-6475-4291-a7c6-262f18598a1a',
  role: 'member',
  extraData: '{"tokenGateId":"bd177a2f-c980-4595-8079-d4bee95a7924"}'
}

export interface TokenGateWithRoles extends TokenGate {
  tokenGateToRoles: (TokenGateToRole & {role: Role})[];
}

export interface TokenGateJwt {
  signedToken: string;
  tokenGate: TokenGateWithRoles;
}

export interface TokenGateEvaluationAttempt {
  userId: string;
  authSig: AuthSig;
  spaceIdOrDomain: string;
}

/**
 * @gateTokens List of Lit-generated tokens we can verify when joining a space
 */
export interface TokenGateEvaluationResult {
  userId: string;
  space: Space;
  walletAddress: string;
  canJoinSpace: boolean;
  gateTokens: TokenGateJwt[]
  roles: Role[]
}

/**
 * Used for passing lit JWTs and gaining membership to a space
 * @commit Whether the token gates for selected tokens should be applied
 */
export interface TokenGateVerification {
  userId: string;
  spaceId: string;
  tokens: (Pick<TokenGateJwt, 'signedToken'> & {tokenGateId: string})[];
  commit: boolean
}

export interface TokenGateVerificationResult {
  userId: string;
  space: Space;
  roles: Role[];
}
