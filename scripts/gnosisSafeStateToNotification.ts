import { prisma } from 'db';

export async function main () {
  const gnosisSafeStates = await prisma.userGnosisSafeState.findMany();
  await prisma.$transaction(gnosisSafeStates.map(gnosisSafeState => prisma.userNotificationState.create({
    data: {
      snoozedUntil: gnosisSafeState.transactionsSnoozedFor,
      snoozeMessage: gnosisSafeState.transactionsSnoozeMessage,
      user: {
        connect: {
          id: gnosisSafeState.userId
        }
      }
    }
  })));
}

main();
