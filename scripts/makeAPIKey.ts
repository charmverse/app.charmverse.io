/* eslint-disable no-console */

import { provisionApiKey } from 'lib/middleware/requireApiKey';
import { prisma } from 'db';

// use this file and run against production to generate api keys

const spaceId = process.env.SPACE_ID; // '30bfda0c-19a6-463d-bef7-daccbf433a04';

(async () => {

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    }
  });

  if (space) {
    const key = await provisionApiKey(space.id);
    console.log('Key provisioned:', key);
  }
  else {
    console.error(`Space not found for id: ${spaceId}`);
  }

  process.exit();

})();
