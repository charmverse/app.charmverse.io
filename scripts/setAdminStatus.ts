// @ts-nocheck

import { RPCList } from 'connectors';
import { prisma } from 'db';

function setAdminStatus (): Promise<any> {

  return new Promise((resolve, reject) => {
    prisma.space.findMany()
      .then(async spaces => {

        for (const space of spaces) {
          await prisma.spaceRole.updateMany({
            where: {
              userId: space.createdBy,
              spaceId: space.id
            },
            data: {
              role: 'admin',
              isAdmin: true
            }
          });
        }

        resolve(true);

      });
  });
}

/*
setAdminStatus()
  .then(() => {
    console.log('Success!');
  });
*/

