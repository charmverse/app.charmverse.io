import type { UnstoppableDomainsAuthSig } from 'lib/blockchain/unstoppableDomains';
import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';

export type OauthFlowType = 'page' | 'popup';

export type AuthType = 'connect' | 'server' | 'login';

export type OauthLoginState<T = undefined> = {
  status: 'success' | 'error';
} & T;

export type GooglePopupLoginState = OauthLoginState<{ googleToken: LoginWithGoogleRequest } | { error: string }>;

export type UdomainsPopupLoginState = OauthLoginState<{ authSig: UnstoppableDomainsAuthSig } | { error: string }>;
