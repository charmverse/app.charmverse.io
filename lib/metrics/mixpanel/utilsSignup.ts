import { typedKeys } from '@root/lib/utils/objects';

import type { SignupCookieType } from '../userAcquisition/interfaces';

import type { SignupAnalytics, SignupSource } from './interfaces/UserEvent';

const referrerMapping: Record<Exclude<SignupSource, '' | 'direct' | 'other'>, string> = {
  'marketing-site': 'www.charmverse.io',
  'organic-search': 'google.com',
  facebook: 'l.facebok.com',
  linkedin: 'www.linkedin.com',
  twitter: 't.co',
  youtube: 'www.youtube.com'
};

function extractSignupSource(url: string = ''): SignupSource {
  try {
    const referrer = new URL(url).hostname;

    const reffererKeys = typedKeys(referrerMapping);

    for (const referrerKey of reffererKeys) {
      if (referrer.match(referrerMapping[referrerKey])) {
        return referrerKey;
      }
    }
  } catch {
    return '';
  }

  return '';
}

export function extractSignupAnalytics(data: Record<SignupCookieType, string>): SignupAnalytics {
  const signupAnalytics: SignupAnalytics = {
    signupCampaign: '',
    signupLandingUrl: '',
    signupSource: '',
    referrerCode: ''
  };

  signupAnalytics.signupCampaign = data.marketingCampaign ?? data.appCampaign ?? '';
  signupAnalytics.signupSource = extractSignupSource(data.marketingReferrer ?? data.appReferrer);
  signupAnalytics.signupLandingUrl = decodeURIComponent(data.marketingLandingPage ?? data.appLandingPage);
  signupAnalytics.referrerCode = data.userReferrerCode ?? '';

  return signupAnalytics;
}
