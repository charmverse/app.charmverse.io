import { prisma } from '@charmverse/core/prisma-client';
import { sampleSize } from 'lodash-es';
import * as emails from 'lib/mailer/emails';
import * as mailer from 'lib/mailer';
import { v4 } from 'uuid';

type SpaceUserMetadata = {
  userId: string;
  username: string;
  email: string;
  avatar: string | null;
};

// const pagePath = 'orange-dao-fellowship-14103747230207953';
// const spaceDomains = ['cyber', 'taiko', 'kyoto', 'cartesi', 'safe'];
// const sample = 200

export async function addOrangeDaoMembersAndCreateNotifications({
  spaceDomains,
  homePagePath,
  sample
}: {
  homePagePath: string;
  spaceDomains: string[];
  sample: number;
}) {
  const page = await prisma.page.findFirstOrThrow({
    where: {
      path: homePagePath
    },
    select: {
      id: true,
      title: true,
      path: true,
      space: {
        select: {
          id: true
        }
      }
    }
  });

  const spaceId = page.space.id;
  const pageId = page.id;

  const spaceAdminRole = await prisma.spaceRole.findFirstOrThrow({
    where: {
      spaceId,
      isAdmin: true
    },
    select: {
      space: {
        select: {
          domain: true,
          name: true
        }
      },
      userId: true
    }
  });

  const space = spaceAdminRole.space;
  const spaceAdminId = spaceAdminRole.userId;
  const spaceUsersRecord: Record<string, SpaceUserMetadata[]> = {};

  for (const spaceDomain of spaceDomains) {
    const spaceRoles = await prisma.spaceRole.findMany({
      where: {
        space: {
          domain: spaceDomain
        },
        user: {
          email: {
            not: null
          },
          proposalsAuthored: {
            some: {
              proposal: {
                status: 'published',
                space: {
                  domain: spaceDomain
                }
              }
            }
          }
        }
      },
      select: {
        user: {
          select: {
            username: true,
            email: true,
            avatar: true
          }
        },
        userId: true,
        spaceId: true
      }
    });

    spaceRoles.forEach((role) => {
      const spaceUser = {
        userId: role.userId,
        username: role.user.username,
        email: role.user.email!,
        avatar: role.user.avatar
      };

      if (spaceUsersRecord[role.spaceId]) {
        spaceUsersRecord[role.spaceId].push(spaceUser);
      } else {
        spaceUsersRecord[role.spaceId] = [spaceUser];
      }
    });
  }

  const totalMembers = new Set(
    Object.values(spaceUsersRecord)
      .map((spaceUsers) => spaceUsers.map((spaceUser) => spaceUser.userId).flat())
      .flat()
  ).size;
  const sampledUsers: Record<string, SpaceUserMetadata> = {};
  Object.values(spaceUsersRecord).forEach((spaceUsers) => {
    const spaceProportion = spaceUsers.length / totalMembers;
    const spaceSampleSize = Math.round(sample * spaceProportion);
    const spaceSampledUsers = sampleSize(
      spaceUsers.filter((spaceUser) => !sampledUsers[spaceUser.userId]),
      spaceSampleSize
    );
    spaceSampledUsers.forEach((spaceUser) => {
      sampledUsers[spaceUser.userId] = spaceUser;
    });
  });

  let completed = 0;
  for (const sampledUser of Object.values(sampledUsers)) {
    try {
      const notificationId = v4();

      await prisma.$transaction([
        prisma.spaceRole.create({
          data: {
            userId: sampledUser.userId,
            spaceId
          }
        }),
        prisma.customNotification.create({
          data: {
            id: notificationId,
            notificationMetadata: {
              create: {
                id: notificationId,
                userId: sampledUser.userId,
                spaceId,
                createdBy: spaceAdminId
              }
            },
            content: {
              pageId
            },
            type: 'orange-dao'
          }
        })
      ]);

      const template = await emails.getOrangeDaoSpaceInviteEmail({
        pagePath: page.path,
        pageTitle: page.title,
        spaceDomain: space.domain,
        user: {
          ...sampledUser,
          id: sampledUser.userId
        },
        spaceName: space.name
      });

      await mailer.sendEmail({
        to: {
          displayName: sampledUser.username,
          email: sampledUser.email!,
          userId: sampledUser.userId
        },
        subject: template.subject,
        html: template.html
      });
    } catch (error) {
      console.error(`Failed to add member ${sampledUser.username}`, {
        error
      });
    } finally {
      completed += 1;
      console.log(`Completed ${completed} of ${Object.values(sampledUsers).length}`);
    }
  }
}

// This was useful only once for updating custom notifications that didn't have the same id with notificationMetadata
async function updateOrangeDaoCustomNotifications() {
  const notifications = await prisma.customNotification.findMany({
    where: {
      type: 'orange-dao'
    },
    select: {
      id: true,
      notificationMetadataId: true
    }
  });

  for (const notification of notifications) {
    const newId = notification.notificationMetadataId;

    await prisma.customNotification.update({
      where: {
        id: notification.id
      },
      data: {
        id: newId
      }
    });

    console.log('Updated customNotification with old id', notification.id, 'into new id', newId);
  }
}
