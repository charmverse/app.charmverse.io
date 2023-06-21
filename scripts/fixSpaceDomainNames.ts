import { prisma } from '@charmverse/core/prisma-client';

async function getInvalidSpaceDomains() {
  const spaces = await prisma.space.findMany({});
  const invalidCharacterSpaces = await prisma.space.findMany({
    where: {
      OR: [
        { domain: {  contains: '.' } },
        { domain: {  contains: ' ' } },
      ]
    },
    select: { domain: true }
  });
  const invalidCharacterDomains = invalidCharacterSpaces.map(space => space.domain);

  const spaceMap: Record<string, number> = {};
  const wrongCaseDomains: string[] = [];

  for (const space of spaces) {
    const domain = space.domain.toLowerCase();
    if (domain !== space.domain) {
      wrongCaseDomains.push(space.domain);
    }

    if (spaceMap[domain]) {
      spaceMap[domain] = spaceMap[domain] + 1;
      console.log('Duplicated domain', domain, 'occurences:', spaceMap[domain]);

      continue;
    }

    spaceMap[domain] = 1;
  }

  console.log('🔥 number of invalid space domains:', wrongCaseDomains.length);

  return [...new Set([ ...invalidCharacterDomains])];
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