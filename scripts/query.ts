import { prisma } from '@charmverse/core/prisma-client';
import { customAlphabet } from 'nanoid';
import fs from 'node:fs/promises';

import { getDiscussionTasks } from 'lib/discussion/getDiscussionTasks';

/**

  userId: cb9a5ede-6ff7-4eaa-9c23-91e684e23aed
  spaceId: 33918abc-f753-4a3d-858d-63c3fa36fa15

  kameil userId: f7d47848-f993-4d16-8008-e1f5b23b8ad3 or 356af4f7-cbd1-4350-b046-9f55da500fec
*/

/**
 * Use this script to perform database searches.
 */

async function search() {
  const acc = await prisma.user.findMany({
    where: {
      username: {
        contains: '0x036'
      }
    }
  });

  console.log(JSON.stringify({ acc }, null, 2));
  // const tasks = await getDiscussionTasks('cb9a5ede-6ff7-4eaa-9c23-91e684e23aed');
  // console.log('tasks', tasks);
  // await fs.writeFile(`${__dirname}/out.json`, JSON.stringify(page, null, 2));
}

search().then(() => console.log('Done'));
