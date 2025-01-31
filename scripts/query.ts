import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';

async function query() {
  const result = await prisma.proposalNotification.findMany({
    where: {
      proposal: {
        page: {
          path: 'appeal-test-475296146939983'
        }
      },
      type: 'proposal_appealed'
      // notificationMetadata: {
      //   user: {
      //     email: {
      //       not: null
      //     },
      //     emailNotifications: true
      //   }
      // }
      // evaluation: {
      //   id: 'c35e1b9c-532b-4d6d-9315-a5dfeb920613'
      // }
    },
    select: {
      notificationMetadata: {
        select: {
          id: true,
          seenAt: true,
          user: {
            select: {
              username: true,
              id: true,
              email: true
            }
          }
        }
      },
      evaluationId: true,
      type: true
    }
    // take: 50
    // include: {
    //   events: {
    //     include: {
    //       builderEvent: true
    //     }
    //   }
    // }
  });

  console.log(result.length);
  const metaIds = result.map((r) => r.notificationMetadata.id);
  console.log(
    await prisma.userNotificationMetadata.updateMany({
      where: {
        id: {
          in: metaIds
        }
      },
      data: { seenAt: new Date(), deletedAt: new Date() }
    })
  );

  return;
  console.log(
    await prisma.spaceRole.count({
      where: {
        space: {
          domain: 'op-grants'
        }
        // spaceRoleToRole: {
        //   some: {
        //     OR: [
        //       {
        //         role: {
        //           name: 'GrantNERDS'
        //         }
        //       },
        //       {
        //         role: {
        //           name: 'Approvers'
        //         }
        //       }
        //     ]
        //   }
        // }
      }
      // select: {
      //   user: {
      //     select: {
      //       username: true
      //     }
      //   }
      // }
    })
  );
  // console.log(await prisma.githubUser.findFirst({ where: { login: 'rikahanabi' }, include: { builder: true } }));
  // console.log(
  //   await prisma.scout.findFirst({
  //     where: { id: 'ac1ab2d2-45b6-44a1-b33d-81da68827e3b' },
  //     include: { githubUsers: true }
  //   })
  // );
}

query();
