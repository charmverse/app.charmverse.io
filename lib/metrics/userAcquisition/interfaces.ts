export const signupCookieNames = [
  'appReferrer',
  'appLandingPage',
  'appCampaign',
  'marketingReferrer',
  'marketingLandingPage',
  'marketingCampaign'
] as const;

export type SignupCookieType = typeof signupCookieNames[number];
