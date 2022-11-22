import { getSpaceByDomain } from 'lib/spaces/getSpaceByDomain';
import { getSpaceDomainFromName } from 'lib/spaces/utils';
import randomName from 'lib/utilities/randomName';

export async function getAvailableDomainName (name?: string, randomize = false): Promise<string> {
  let spaceDomain = name ? getSpaceDomainFromName(name) : randomName();
  if (randomize && name) {
    spaceDomain = `${name}-${randomName()}`;
  }

  const existingSpace = await getSpaceByDomain(spaceDomain);

  if (existingSpace) {
    return getAvailableDomainName(name, true);
  }

  return spaceDomain;
}
