import type { UnstoppableDomainsAuthSig } from 'lib/blockchain/unstoppableDomains';

export type OauthFlowType = 'page' | 'popup';

export type AuthType = 'connect' | 'server' | 'login';

export type OauthLoginState<T = undefined> = {
  status: 'success' | 'error';
} & T;

export type GooglePopupLoginState = OauthLoginState<{ code: string } | { error: string }>;

export type UdomainsPopupLoginState = OauthLoginState<{ authSig: UnstoppableDomainsAuthSig } | { error: string }>;
