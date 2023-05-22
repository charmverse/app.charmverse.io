import { isDevEnv, isProdEnv, isStagingEnv } from 'config/constants';

const cookieDomains = {
  dev: 'local.io',
  staging: 'charmverse.co',
  prod: 'charmverse.io'
};

export function getCookieDomain() {
  if (isDevEnv) {
    return cookieDomains.dev;
  }

  if (isStagingEnv) {
    return cookieDomains.staging;
  }

  if (isProdEnv) {
    return cookieDomains.prod;
  }
}
