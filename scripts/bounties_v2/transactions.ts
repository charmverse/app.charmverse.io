import { prisma } from 'db';

export async function portTransactionDataFromBountiesToApplications () {

  /*
  const transactions = await prisma.transaction.findMany({
    where: {
      bounty: {
        status: 'paid'
      }
    },
    include: {
      bounty: {
        include: {
          applications: true
        }
      }
    }
  });

  console.log('Found ', transactions.length, 'transactions');

  for (const tx of transactions) {
    const bounty = tx.bounty;
    const relevantApp = bounty?.applications.find(app => app.createdBy === bounty.assignee);

    if (relevantApp) {
      await prisma.transaction.update({
        where: {
          id: tx.id
        },
        data: {
          application: {
            connect: {
              id: relevantApp.id
            }
          }
        }
      });
    }
  }
  */

  return true;

}
