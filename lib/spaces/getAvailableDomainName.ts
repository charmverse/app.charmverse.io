import { getSpaceByDomain } from 'lib/spaces/getSpaceByDomain';
import randomName from 'lib/utilities/randomName';

export async function getAvailableDomainName (name?: string, randomize = false): Promise<string> {
  let checkName = name || randomName();
  if (randomize && name) {
    checkName = `${name}-${randomName()}`;
  }

  const existingSpace = await getSpaceByDomain(checkName);

  if (existingSpace) {
    return getAvailableDomainName(name, true);
  }

  return checkName;
}
