import { appSubdomain, isDevEnv, isStagingEnv } from '@packages/config/constants';
import { getAppApexDomain } from '@packages/lib/utils/domains/getAppApexDomain';
import { isLocalhostAlias } from '@packages/lib/utils/domains/isLocalhostAlias';

import { getSpaceDomainFromHost } from './domains/getSpaceDomainFromHost';

export function getAppOriginURL({ protocol, port, host }: { protocol?: string; host?: string; port?: string }) {
  const appDomain = getAppApexDomain();
  const portValue = port || host?.split(':')[1] || '';
  const appPort = portValue ? `${portValue[0] === ':' ? '' : ':'}${portValue}` : '';
  const appProtocol = protocol || 'https://';

  if (isLocalhostAlias(host) || (isStagingEnv && !getSpaceDomainFromHost(host))) {
    return host?.startsWith('http') ? new URL(host) : new URL(`${appProtocol}${host}/`);
  }

  if (isDevEnv && !host?.includes(getAppApexDomain())) {
    return new URL(`http://localhost${appPort}/`);
  }

  return new URL(`${appProtocol}${appSubdomain}.${appDomain}${appPort}/`);
}
