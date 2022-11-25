// @ts-nocheck
import { User} from '@prisma/client'
import { prisma } from 'db';

async function init () {

  const users = await prisma.user.findMany({
    orderBy: {
      'createdAt': 'asc'
    },
    include: {
      spaceRoles: true,
      wallets: true
    }
  })

  const addressMap = users.reduce<{ [address: string]: typeof users }>((acc, user) => {
    user.addresses.forEach(a => {
      acc[a] = acc[a] || [];
      acc[a].push(user);
    });
    return acc;
  }, {});

  const addressesWithMultipleUsers = Object.entries(addressMap).filter(([address, _users]) => _users.length > 1);
  const duplicateAccounts: typeof users = [];
  const needsNewWallet: typeof users = [];

  // find cases where one user already has a wallet associated - we can mark all the others 'deleted'
  const unresolved = addressesWithMultipleUsers.filter(([address, _users]) => {
    const usersWithWallets = _users.filter(u => u.wallets.length > 0);
    if (usersWithWallets.length === 1) {
      duplicateAccounts.push(..._users.filter(u => u.id !== usersWithWallets[0].id));
      return false;
    }
    return true;
  });

  // if none of the users have a workspace associated, we can delete all but one
  const unresolved2 = unresolved.filter(([address, _users]) => {
    const withSpace = _users.filter(u => u.spaceRoles.length > 0);
    // only one user has a workspace
    if (withSpace.length === 1) {
      duplicateAccounts.push(..._users.filter(u => u.id !== withSpace[0].id));
      if (withSpace[0].wallets.length === 0) {
        needsNewWallet.push(withSpace[0]);
      }
      return false;
    }
    // none of the users have a workspace, just keep the first one
    else if (withSpace.length === 0) {
      duplicateAccounts.push(..._users.filter(u => u.id !== _users[0].id));
      if (_users[0].wallets.length === 0) {
        needsNewWallet.push(_users[0]);
      }
      return false;
    }
    return true;
  });

  // calculate to double-check math
  let usersAffected = Object.values(addressMap).reduce<Set<string>>((ids, _users) => {
    if (_users.length > 1) {
      _users.forEach(u => ids.add(u.id));
    }
    return ids;
  }, new Set());

  const usersToMarkDeleted = duplicateAccounts.filter(u => u.spaceRoles.length > 0);
  const usersToDelete = duplicateAccounts.filter(u => u.spaceRoles.length === 0);

  console.log('Addresses with multiple users', addressesWithMultipleUsers.length);
  console.log('Affected users', usersAffected.size);
  console.log('Unresolved situations', unresolved2.length);
  console.log('Users to "delete"', duplicateAccounts.length);
  console.log('Users to mark deleted', usersToMarkDeleted.length);
  console.log('Users that need a wallet record created', needsNewWallet.length);
  console.log('Users to delete because they have no workspace', usersToDelete.length);

  // for safety
  usersToDelete.forEach(u => {
    if (u.spaceRoles.length > 0 || u.wallets.length > 0) {
      throw new Error('User should not have any space roles or wallets');
    }
  });


  console.log('mark deleted', await prisma.user.updateMany({
    where: {
      id: {
        in: usersToMarkDeleted.map(u => u.id)
      }
    },
    data: {
      deletedAt: new Date(),
      username: `Profile with duplicate wallet removed`
    }
  }))

  console.log('deleted completely', await prisma.user.deleteMany({
    where: {
      id: {
        in: usersToDelete.map(u => u.id)
      }
    }
  }));

  for (let user of needsNewWallet) {
    await prisma.userWallet.create({
      data: {
        userId: user.id,
        address: user.addresses[0],
      }
    });
  }

}

init().then(r => {
  process.exit();
}).catch(e => {
  console.error(e);
  process.exit(1);
})