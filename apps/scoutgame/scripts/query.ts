import { prisma } from '@charmverse/core/prisma-client';
import { getUserByPath } from 'lib/users/getUserByPath';

async function query() {
  const existingAccounts = await getUserByPath('thescoho');
  console.log(existingAccounts);
}

query();
