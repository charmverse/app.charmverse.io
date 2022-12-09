import { getSpaceByDomain } from 'lib/spaces/getSpaceByDomain';
import { DOMAIN_BLACKLIST, getSpaceDomainFromName } from 'lib/spaces/utils';
import randomName from 'lib/utilities/randomName';

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
