import { prisma } from 'db';

export async function main () {
  // const gnosisSafeStates = await prisma.userGnosisSafeState.findMany();
  // await prisma.$transaction(gnosisSafeStates.map(gnosisSafeState => prisma.notificationState.create({
  //   data: {
  //     snoozedUntil: gnosisSafeState.snoozedUntil,
  //     snoozeMessage: gnosisSafeState.snoozeMessage,
  //     user: {
  //       connect: {
  //         id: gnosisSafeState.userId
  //       }
  //     }
  //   }
  // })));
}

main();
