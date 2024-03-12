export const signupCookieNames = [
  'appReferrer',
  'appLandingPage',
  'appCampaign',
  'marketingReferrer',
  'marketingLandingPage',
  'marketingCampaign',
  'userReferrerCode'
] as const;

export type SignupCookieType = (typeof signupCookieNames)[number];
