import { getSpaceByDomain } from 'lib/spaces/getSpaceByDomain';
import { getSpaceDomainFromName } from 'lib/spaces/utils';
import randomName from 'lib/utilities/randomName';

export async function getAvailableDomainName (name?: string, randomize = false): Promise<string> {
  const domainName = getSpaceDomainFromName(name || '');

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
