import { prisma } from '@charmverse/core/prisma-client';
import { uniq } from 'lodash';
/**
 * Use this script to perform database searches.
 */

async function search() {
  const acc = await prisma.tokenGate.findMany({
    where: {
      type: 'lit'
    },
    select: {
      id: true,
      space: true,
      conditions: true
    }
  });
  const found = acc.find((a) =>
    a.conditions?.unifiedAccessControlConditions?.find((u) => u.standardContractType === 'MolochDAOv2.1')
  );
  console.log('xxx', found?.conditions.unifiedAccessControlConditions, found?.space.name);
}

search().then(() => console.log('Done'));
