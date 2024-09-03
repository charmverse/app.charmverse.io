import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';
import { uniqBy, uniq } from 'lodash';
/**
 * Use this script to perform database searches.
 */
import { readEcosystems } from './github/query';

const cutoffDate = new Date('2024-01-01');
async function query() {
  const allEcos = await prisma.cryptoEcosystem.findMany({
    include: {
      repos: true
    }
  });

  const reposFromEcos = allEcos.flatMap((e) => e.repos);
  const allRepos = await prisma.cryptoEcosystemRepo.findMany({});
  console.log('allRepos', allRepos.length);
  console.log('reposFromEcos', reposFromEcos.length);
  const urlMap = allRepos.reduce<Record<string, boolean>>((acc, r) => {
    acc[r.url] = true;
    return acc;
  }, {});
  console.log('no match by url', reposFromEcos.filter((r) => !urlMap[r.url]).length);
  // const result2 = await prisma.cryptoEcosystemAuthor.count({});
  // console.log(result2);
}

query();
