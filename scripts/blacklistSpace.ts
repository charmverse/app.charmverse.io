import { prisma } from '@charmverse/core/prisma-client';
import { blacklistUser } from '@packages/users/blacklistUser';

/**
 * Use this script to retrieve and blacklist a space
 */

const spaceDomain = 'dirty-brown-caterpillar';

async function search(domain: string) {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      domain
    },
    include: {
      spaceRoles: {
        include: { user: { include: { wallets: true } } }
      }
    }
  });

  console.log(`
Results for domain: ${domain}

  Space: ${space.name} (https://app.charmverse.io/${space.domain})
  Created: ${space.createdAt.toLocaleDateString()}
  Users:
  ${space.spaceRoles.map((sr) => `  ${userRow(sr.user, sr.isAdmin)}`).join('\n')}
    `);

  const otherSpaces = await prisma.space.findMany({
    where: {
      id: {
        not: space.id
      },
      createdBy: {
        in: space.spaceRoles.map((role) => role.user.id)
      }
    }
  });

  console.log('Found', otherSpaces.length, 'other spaces created by users in the space:');
  otherSpaces.map((s) => console.log(s.name, s.domain));
  console.log('');
}

function userRow(
  user: { id: string; createdAt: Date; username: string; email: string | null; wallets: { address: string }[] },
  isAdmin: boolean
) {
  const email = user.email && user.username !== user.email ? `${user.email}` : '';
  const wallet = user.wallets.map((w) => w.address).join(', ');
  return `${user.username}${email}${wallet ? ' ' + wallet : ''}${
    isAdmin ? ' (admin)' : ''
  } - joined ${user.createdAt.toLocaleDateString()} id: ${user.id}`;
}

async function deleteSpace(domain: string) {
  if (!domain) {
    throw new Error('No space domain defined');
  }
  const result = await prisma.space.delete({
    where: {
      domain
    },
    select: {
      spaceRoles: {
        where: {
          isAdmin: true
        },
        select: {
          userId: true
        }
      }
    }
  });
  const adminUserIds = result.spaceRoles.map((sr) => sr.userId);
  for (const adminUserId of adminUserIds) {
    await blacklistUser(adminUserId);
  }
  console.log('Deleted space', result);
}

search(spaceDomain).then(() => process.exit());

//deleteSpace(spaceDomain).then(() => process.exit());
