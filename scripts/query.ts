import { prisma } from '@charmverse/core/prisma-client';
import { createDraftProposal } from 'lib/proposals/createDraftProposal';

/**
 * Use this script to perform database searches.
 */

const spaceId = 'f3ddde2e-17e9-42b1-803d-0c72880e4669';

async function replaceReviewer(originalUser: string, newUser: string) {
  const reviewers = await prisma.proposalReviewer.updateMany({
    where: {
      proposal: { spaceId },
      userId: originalUser
    },
    data: {
      userId: newUser
    }
  });
  const spaceRole = await prisma.spaceRole
    .updateMany({
      where: {
        spaceId,
        userId: originalUser
      },
      data: {
        userId: newUser
      }
    })
    .catch((e) => {
      console.error('could not update space role');
      // return prisma.spaceRole.deleteMany({
      //   where: {
      //     spaceId,
      //     userId: originalUser
      //   }
      // });
    });
  const appealreviewers = await prisma.proposalAppealReviewer.updateMany({
    where: {
      proposal: { spaceId },
      userId: originalUser
    },
    data: {
      userId: newUser
    }
  });
  const emails = await prisma.verifiedEmail.updateMany({
    where: {
      userId: originalUser
    },
    data: {
      userId: newUser
    }
  });
  const googleAccounts = await prisma.googleAccount.updateMany({
    where: {
      userId: originalUser
    },
    data: {
      userId: newUser
    }
  });
  console.log('updated ', originalUser, '->', newUser, {
    emails,
    googleAccounts,
    spaceRole,
    reviewers,
    appealreviewers
  });
}

async function search() {
  const original = await prisma.user.findMany({
    where: {
      verifiedEmails: {
        some: {
          email: 'tamara@helenius.com'
        }
      }
    },
    include: {
      verifiedEmails: true,
      googleAccounts: true,
      wallets: true,
      spaceRoles: true
    }
  });
  const replacement = await prisma.user.findMany({
    where: {
      username: 'tamarandom.eth'
    },
    include: {
      verifiedEmails: true,
      wallets: true,
      googleAccounts: true,
      spaceRoles: true
    }
  });

  // await replaceReviewer(original[0].id, replacement[0].id);

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
