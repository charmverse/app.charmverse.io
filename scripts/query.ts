import { prisma } from '@charmverse/core/prisma-client';
import { uniq } from 'lodash';
/**
 * Use this script to perform database searches.
 */

const userId = '4e1d4522-6437-4393-8ed1-9c56e53235f4';

async function search() {
  await prisma.projectMember.deleteMany({})
  await prisma.project.deleteMany({})
}

search().then(() => console.log('Done'));
