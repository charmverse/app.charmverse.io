import { appSubdomain, baseUrl, isDevEnv, isProdEnv, isStagingEnv } from '@root/config/constants';
import { getAppApexDomain } from '@root/lib/utils/domains/getAppApexDomain';
import { getCustomDomainFromHost } from '@root/lib/utils/domains/getCustomDomainFromHost';
import { getSpaceDomainFromHost } from '@root/lib/utils/domains/getSpaceDomainFromHost';
import { getAppOriginURL } from '@root/lib/utils/getAppOriginURL';

export function getCallbackDomain(host?: string | undefined) {
  const protocol = isProdEnv || isStagingEnv ? `https://` : `http://`;

  if (isDevEnv) {
    return `http://localhost:3000`;
  }

  if (!host) {
    if (isStagingEnv) {
      return baseUrl || '';
    }
    return `${protocol}${appSubdomain}.${getAppApexDomain()}`;
  }

  if (getCustomDomainFromHost(host)) {
    return getAppOriginURL({ protocol, host }).toString().replace(/\/$/, '');
  }

  const subdomain = getSpaceDomainFromHost(host);

  if (!subdomain && isStagingEnv) {
    return baseUrl || `${protocol}${host}`;
  }

  const callbackDomain = subdomain ? `${protocol}${host?.replace(subdomain, 'app')}` : `${protocol}${host}`;

  return callbackDomain;
}
