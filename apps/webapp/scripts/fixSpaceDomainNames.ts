import { prisma } from '@charmverse/core/prisma-client';
import { getSpaceDomainFromName } from '@packages/spaces/utils';

async function getInvalidSpaceDomains() {
  const spaces = await prisma.space.findMany({});
  const spaceMap: Record<string, number> = {};
  const invalidSpaceDomains: string[] = [];

  for (const space of spaces) {
    const domain = getSpaceDomainFromName(space.domain);
    if (domain !== space.domain) {
      invalidSpaceDomains.push(space.domain);
    }

    if (spaceMap[domain]) {
      spaceMap[domain] = spaceMap[domain] + 1;
      console.log('Duplicated domain', domain, 'occurences:', spaceMap[domain]);

      continue;
    }

    spaceMap[domain] = 1;
  }

  console.log('🔥 number of invalid space domains:', invalidSpaceDomains.length);
  console.log('🔥 invalid space domains:', invalidSpaceDomains);

  return invalidSpaceDomains;
}

async function fixSpaceDomainNames() {
  const invalidSpaceDomains = await getInvalidSpaceDomains();

  for (const invalidDomain of invalidSpaceDomains) {
    const updatedDomain = invalidDomain.toLowerCase().replace(/(\s|\.)/g, '-');
    console.log('🔥', `updating ${invalidDomain} -> ${updatedDomain}`);

    await prisma.space.update({
      where: {
        domain: invalidDomain
      },
      data: {
        domain: updatedDomain
      }
    });
  }
}

fixSpaceDomainNames().then(() => console.log('Done'));
