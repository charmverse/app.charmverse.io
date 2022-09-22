/* eslint-disable no-console */

import { provisionApiKey } from 'lib/middleware/requireApiKey';
import { prisma } from 'db';

// use this file and run against production to generate api keys


(async () => {

  const space = await prisma.space.findUnique({
    where: {
      domain: 'filmio'
    }
  });

  if (space) {
    const key = await provisionApiKey(space.id);
    console.log('Key provisioned:', key);
  } else {
    console.log('Space not found')
  }
})();
