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
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId
    },
    include: {
      user: {
        include: {
          verifiedEmails: true
        }
      }
    }
  });
  // console.log(
  //   await prisma.user.findUnique({
  //     where: { id: '6aca94ab-9ab9-4487-959a-a0a56963a174' },
  //     include: { verifiedEmails: true, googleAccounts: true, spaceRoles: true }
  //   })
  // );

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

  // console.log('original', JSON.stringify(original, null, 2));
  // console.log('replacement', JSON.stringify(replacement, null, 2));
  //  await replaceReviewer('476e6a7e-3e8f-471e-b14b-3984063cc834', '71e65d73-1ebe-4fcf-8083-674eff97a977');
  // await prisma.userWallet.updateMany({
  //   where: {
  //     userId: '4954b2ab-322a-4858-a7b2-668a618b1d78'
  //   },
  //   data: {
  //     userId: '82e7a6ba-884e-4a6d-9bd5-5f7e590cfe47'
  //   }
  // });

  await replaceReviewer(original[0].id, replacement[0].id);
  // const reviewers = await prisma.proposalReviewer.updateMany({
  //   where: {
  //     proposal: {
  //       spaceId,
  //       page: {
  //         path: 'page-6103446853185903'
  //       }
  //     },
  //     userId: original.id
  //   },
  //   data: {
  //     userId: replacement.id
  //   }
  // });
  // console.log(reviewers);

  // const appealreviewers = await prisma.proposalAppealReviewer.findMany({
  //   where: {
  //     proposal: {
  //       spaceId,
  //       page: {
  //         path: 'page-6103446853185903'
  //       }
  //     },
  //     userId: original.id
  //   }
  // });
  // console.log(reviewers.length);
  // console.log(appealreviewers.length);
  return;

  // for (const spaceRole of spaceRoles) {
  //   const email = spaceRole.user.verifiedEmails[0]?.email;
  //   if (!email) {
  //     //console.log('no email', spaceRole.user.username);
  //     continue;
  //   }
  //   const users = await prisma.user.findMany({
  //     where: {
  //       deletedAt: null,
  //       OR: [{ email }, { googleAccounts: { some: { email } } }]
  //     },
  //     include: {
  //       googleAccounts: true
  //     }
  //   });
  //   const notThisUser = users.filter((user) => !user.id.includes(spaceRole.userId));
  //   if (notThisUser.length === 1) {
  //     console.log(
  //       'mergeable accounts:',
  //       email,
  //       spaceRole.user.createdAt,
  //       notThisUser.map((u) => 'Email: ' + u.email + ' Google: ' + u.googleAccounts.map((g) => g.email).join(', '))
  //     );
  //   }
  // }
  // const verifiedUser = await prisma.verifiedEmail.findUniqueOrThrow({
  //   where: {
  //     email: 'alex.poon@charmverse.io'
  //   },
  //   include: {
  //     user: true
  //   }
  // });
  // const googleUser = await prisma.googleAccount.findUniqueOrThrow({
  //   where: {
  //     email: 'alex.poon@charmverse.io'
  //   }
  // });
  // console.log('verified', verifiedUser.user.createdAt);
  // console.log('google', googleUser.userId);

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
