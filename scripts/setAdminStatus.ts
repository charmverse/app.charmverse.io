// @ts-nocheck

import { RPCList } from 'connectors';
import { prisma } from 'db';

/**
 * Restore admin status
 */
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

/**
 * Moving away from role names
 */
async function migrateAdminStatus () {
  prisma.spaceRole.updateMany({
    where: {
      role: 'admin'
    },
    data: {
      isAdmin: true
    }
  }).then(data => {
    // console.log(data.count, ' space roles affected');

    return true;
  });
}

/*
migrateAdminStatus()
  .then(() => {
    console.log('Job complete');
  });
*/
