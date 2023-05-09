import { prisma } from '@charmverse/core';
import { customAlphabet } from 'nanoid';
import fs from 'node:fs/promises';

import * as opts from 'nanoid-dictionary';
console.log(opts)
function uid( ) {
  return Math.round(Date.now() + Math.random() * 1000).toString(36)
}
function uid2 () {
  return customAlphabet(opts.lowercase + opts.numbers, 8)();
}
/**
 * Use this script to perform database searches.
 */

async function search() {
  const page = await prisma.page.findFirst({
    where: {
      path: `page-12890905063646585`
    },
    include: {
      author: true,
      diffs: {
        orderBy: {
          version: 'asc'
        }
      }
    }
  })

  await fs.writeFile(`${__dirname}/out.json`, JSON.stringify(page, null, 2))
}

search().then(() => console.log('Done'));
