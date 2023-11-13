import { prisma } from '@charmverse/core/prisma-client';

async function findTokenGateType() {
  const tokenGates = await prisma.tokenGate.findMany({
    where: {
      accessTypes: {
        has: 'dao_members'
      }
    },
    include: {
      space: {
        select: {
          domain: true,
          customDomain: true
        }
      }
    }
  });

  console.log('tokenGates', tokenGates);
}

findTokenGateType();
