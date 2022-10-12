import { prisma } from 'db';
import { getAccessTypes } from 'lib/token-gates/utils';
import { AccessControlCondition } from 'lit-js-sdk';
import { flatten } from 'lodash';

async function updateTokenGateAccessTypes () {
  const tokenGates = await prisma.tokenGate.findMany();

  const promises = tokenGates.map(({ id, conditions: conditionsData }) => {
    const conditionsArr: AccessControlCondition[] = flatten((conditionsData as any)?.unifiedAccessControlConditions);
    const conditions = conditionsArr.filter(c => Boolean(c.chain));
    const accessTypes = getAccessTypes(conditions);

    return prisma.tokenGate.update({
      where: { id },
      data: { accessTypes }
    })
  });

  await Promise.all(promises);

  console.log('🔥 Updated accessTypes for all token gates.');
}


updateTokenGateAccessTypes();
