import { prisma } from '@charmverse/core/prisma-client';
import { createDraftProposal } from 'lib/proposals/createDraftProposal';

/**
 * Use this script to perform database searches.
 */

const spaceId = 'f3ddde2e-17e9-42b1-803d-0c72880e4669';

async function search() {
  const verifiedUser = await prisma.verifiedEmail.findUniqueOrThrow({
    where: {
      email: 'alex.poon@charmverse.io'
    },
    include: {
      user: true
    }
  });
  const googleUser = await prisma.googleAccount.findUniqueOrThrow({
    where: {
      email: 'alex.poon@charmverse.io'
    }
  });
  console.log('verified', verifiedUser.user.createdAt);
  console.log('google', googleUser.userId);
  // const reviewers = await prisma.proposalReviewer.updateMany({
  //   where: {
  //     proposal: { spaceId },
  //     userId: verifiedUser.userId
  //   },
  //   data: {
  //     userId: googleUser.userId
  //   }
  // });
  // const spaceRole = await prisma.spaceRole.deleteMany({
  //   where: {
  //     spaceId,
  //     userId: verifiedUser.userId
  //   }
  // });
  // const appealreviewers = await prisma.proposalAppealReviewer.updateMany({
  //   where: {
  //     proposal: { spaceId },
  //     userId: verifiedUser.userId
  //   },
  //   data: {
  //     userId: googleUser.userId
  //   }
  // });
  // console.log(spaceRole, reviewers, appealreviewers);
  // console.log(
  //   await prisma.page.delete({
  //     where: {
  //       id: 'a18016bd-a6e8-4b78-9e3f-c64aafa4d3b7'
  //     }
  //   })
  // );
  // console.log(
  //   await prisma.proposal.delete({
  //     where: {
  //       id: 'a18016bd-a6e8-4b78-9e3f-c64aafa4d3b7'
  //     }
  //   })
  // );
  // const proposal = await prisma.proposal.findUniqueOrThrow({
  //   where: {
  //     id: 'a8ac2799-5c79-45f7-9527-a1d52d717625'
  //   },
  //   include: {
  //     form: {
  //       include: {
  //         formFields: true
  //       }
  //     }
  //   }
  // });
  // console.log(proposal.form.formFields);
}

search().then(() => console.log('Done'));
