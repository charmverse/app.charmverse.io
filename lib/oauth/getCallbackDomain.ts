import { appSubdomain, isDevEnv, isProdEnv, isStagingEnv } from 'config/constants';
import { getAppApexDomain } from 'lib/utilities/domains/getAppApexDomain';
import { getValidCustomDomain } from 'lib/utilities/domains/getValidCustomDomain';
import { getAppOriginURL } from 'lib/utilities/getAppOriginURL';
import { getValidSubdomain } from 'lib/utilities/getValidSubdomain';

export function getCallbackDomain(host: string | undefined) {
  const protocol = isProdEnv || isStagingEnv ? `https://` : `http://`;

  if (!host) {
    if (isDevEnv) {
      return `http://localhost:3000/`;
    }

    return `${protocol}//${appSubdomain}.${getAppApexDomain()}`;
  }

  if (getValidCustomDomain(host)) {
    return getAppOriginURL({ protocol, host }).toString().replace(/\/$/, '');
  }

  const subdomain = getValidSubdomain(host);
  const callbackDomain = subdomain ? `${protocol}${host?.replace(subdomain, 'app')}` : `${protocol}${host}`;

  return callbackDomain;
}
