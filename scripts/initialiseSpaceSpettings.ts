import { prisma } from 'db';

async function initialiseSpaceSettings (): Promise<true> {
  // Assigns the default values necessary for this PR
  await prisma.space.updateMany({
    data: {
      defaultPublicPages: false,
      permissionConfigurationMode: 'custom'
    }
  });

  return true;
}

/*
initialiseSpaceSettings().then((result) => {
  console.log('Complete');
});
*/
