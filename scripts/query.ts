import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';

async function query() {
  const result = await prisma.user.findFirst({
    where: {
      username: 'short-staking-fly'
    },
    include: {
      spaceRoles: true,
      wallets: true,
      verifiedEmails: true,
      discordUser: true,
      telegramUser: true,
      reviews: true
    }
  });
  // prettyPrint(result);
  await prisma.user.update({
    where: {
      id: '2de89d1a-49b6-49dd-ab17-2f27bdca8818'
    },
    data: {
      deletedAt: new Date()
    }
  });
  // console.log(
  //   await prisma.verifiedEmail.updateMany({
  //     where: {
  //       userId: '2de89d1a-49b6-49dd-ab17-2f27bdca8818'
  //     },
  //     data: {
  //       userId: 'e4fa2baa-61e2-48a5-98e3-355bae0e924c'
  //     }
  //   })
  // );
  // console.log(
  //   await prisma.proposalReviewer.updateMany({
  //     where: {
  //       userId: '2de89d1a-49b6-49dd-ab17-2f27bdca8818'
  //     },
  //     data: {
  //       userId: 'e4fa2baa-61e2-48a5-98e3-355bae0e924c'
  //     }
  //   })
  // );
  // console.log(
  //   await prisma.proposalAppealReviewer.updateMany({
  //     where: {
  //       userId: '2de89d1a-49b6-49dd-ab17-2f27bdca8818'
  //     },
  //     data: {
  //       userId: 'e4fa2baa-61e2-48a5-98e3-355bae0e924c'
  //     }
  //   })
  // );
  console.log(
    await prisma.proposalEvaluationReview.updateMany({
      where: {
        reviewerId: '2de89d1a-49b6-49dd-ab17-2f27bdca8818'
      },
      data: {
        reviewerId: 'e4fa2baa-61e2-48a5-98e3-355bae0e924c'
      }
    })
  );
}

query();
