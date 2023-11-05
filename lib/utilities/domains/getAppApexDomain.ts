import { isProdEnv, isStagingEnv } from 'config/constants';

const cookieDomains = {
  dev: 'local.io',
  staging: 'charmverse.co',
  prod: 'charmverse.io'
};

export function getAppApexDomain() {
  if (isStagingEnv) {
    return cookieDomains.staging;
  }

  if (isProdEnv) {
    return cookieDomains.prod;
  }

  return cookieDomains.dev;
}
