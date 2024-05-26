import { prisma } from '@charmverse/core/prisma-client';
import _ from 'lodash';
import * as emails from 'lib/mailer/emails';
import * as mailer from 'lib/mailer';

type SpaceUserMetadata = {
  userId: string
  username: string
  email: string
  avatar: string | null
}

export async function addMembersAndCreateNotifications() {
  const spaceId = '';
  const pageId = '';
  const spaceDomains = ['cyber', 'taiko', 'kyoto', 'cartesi', 'safe'];
  const [spaceAdminRole, page] = await Promise.all([prisma.spaceRole.findFirstOrThrow({
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
  }), prisma.page.findUniqueOrThrow({
    where: {
      id: pageId
    },
    select: {
      title: true,
      path: true
    }
  })])

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
                status: "published",
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
    })

    spaceRoles.forEach((role) => {
      const spaceUser = {
        userId: role.userId,
        username: role.user.username,
        email: role.user.email!,
        avatar: role.user.avatar
      }

      if (spaceUsersRecord[role.spaceId]) {
        spaceUsersRecord[role.spaceId].push(spaceUser)
      } else {
        spaceUsersRecord[role.spaceId] = [spaceUser]
      }
    })
  }

  const totalMembers = Object.values(spaceUsersRecord).reduce((acc, curr) => acc + curr.length, 0)
  const sample = 200;
  const sampledUsers: Record<string, SpaceUserMetadata> = {};;
  Object.values(spaceUsersRecord).forEach((spaceUsers) => {
    const spaceProportion = spaceUsers.length / totalMembers;
    const spaceSampleSize = Math.round(sample * spaceProportion);
    const spaceSampledUsers = _.sampleSize(spaceUsers.filter(spaceUser => sampledUsers[spaceUser.userId]), spaceSampleSize);
    spaceSampledUsers.forEach((spaceUser) => {
      sampledUsers[spaceUser.userId] = spaceUser
    })
  })
  let completed = 0;
  for (const sampledUser of Object.values(sampledUsers)) {
    try {
      await prisma.$transaction([
        prisma.spaceRole.create({
          data: {
            userId: sampledUser.userId,
            spaceId
          }
        }),
        prisma.customNotification.create({
          data: {
            notificationMetadata: {
              create: {
                userId: sampledUser.userId,
                spaceId,
                createdBy: spaceAdminId,
              },
            },
            content: {
              pageId,
            },
            type: "orange-dao"
          }
        })
      ])
  
      const template = emails.getOrangeDaoSpaceInviteEmail({
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
      console.error(`Failed to add member ${sampledUser.username}`)
    } finally {
      completed += 1;
      console.log(`Completed ${completed} of ${Object.values(sampledUsers).length}`)
    }
  }
}

addMembersAndCreateNotifications()