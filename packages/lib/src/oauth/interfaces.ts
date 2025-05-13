export type OauthFlowType = 'popup';

export type AuthType = 'connect' | 'server' | 'login';

export type OauthLoginState<T = undefined> = {
  status: 'success' | 'error';
} & T;

export type GooglePopupLoginState = OauthLoginState<{ code: string } | { error: string }>;
