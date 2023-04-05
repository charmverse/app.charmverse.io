import { getAccessiblePages, includePagePermissionsMeta } from 'lib/pages/server';
import { prisma } from 'db';
import { customAlphabet } from 'nanoid';

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
  const uids = new Set();
  const uid2s = new Set();
  for (let i = 0; i < 10000; i++) {
    uids.add(uid());
  }
  for (let i = 0; i < 10000; i++) {
    uid2s.add(uid2());
  }
  console.log(uids.size, uid2s.size)
}

search();
