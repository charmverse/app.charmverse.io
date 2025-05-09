import { DOMAIN_BLACKLIST } from '@packages/spaces/config';
import { getSpaceByDomain } from '@packages/spaces/getSpaceByDomain';
import { getSpaceDomainFromName } from '@packages/spaces/utils';
import { randomName } from '@packages/utils/randomName';

export async function getAvailableDomainName(name?: string, randomize = false): Promise<string> {
  const domainName = getSpaceDomainFromName(name || '');

  if (DOMAIN_BLACKLIST.includes(domainName)) {
    // randomize the domain name when it is blacklisted one
    return getAvailableDomainName(name, true);
  }

  let spaceDomain = domainName || randomName();
  if (randomize && name) {
    spaceDomain = `${domainName}-${randomName()}`;
  }

  const existingSpace = await getSpaceByDomain(spaceDomain);

  if (existingSpace) {
    return getAvailableDomainName(name, true);
  }

  return spaceDomain;
}
