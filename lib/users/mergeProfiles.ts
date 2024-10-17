import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
// Please read before running. Not battle-tested
export async function mergeProfiles({
  primaryProfileId,
  secondaryProfileId
}: {
  primaryProfileId: string;
  secondaryProfileId: string;
}) {
  const primary = await prisma.user.findUniqueOrThrow({
    where: {
      id: primaryProfileId
    },
    select: {
      spaceRoles: true
    }
  });

  const secondary = await prisma.user.findUniqueOrThrow({
    where: {
      id: secondaryProfileId
    },
    select: {
      spaceRoles: true
    }
  });

  const matching = primary.spaceRoles.filter((role) =>
    secondary.spaceRoles.some((secondaryRole) => secondaryRole.spaceId === role.spaceId)
  );
  if (matching.length > 0) {
    log.debug(`Deleting instead of replacing ${matching.length} matching space roles`);
    await prisma.spaceRole.deleteMany({
      where: {
        id: {
          in: matching.map((role) => role.id)
        }
      }
    });
  }

  const results = await prisma.$transaction([
    prisma.page.updateMany({
      where: {
        createdBy: secondaryProfileId
      },
      data: {
        createdBy: primaryProfileId
      }
    }),
    prisma.page.updateMany({
      where: {
        updatedBy: secondaryProfileId
      },
      data: {
        updatedBy: primaryProfileId
      }
    }),
    prisma.page.updateMany({
      where: {
        deletedBy: secondaryProfileId
      },
      data: {
        deletedBy: primaryProfileId
      }
    }),
    prisma.user.update({
      where: {
        id: secondaryProfileId
      },
      data: {
        deletedAt: new Date()
      }
    }),
    prisma.spaceRole.updateMany({
      where: {
        userId: secondaryProfileId
      },
      data: {
        userId: primaryProfileId
      }
    }),
    prisma.userWallet.updateMany({
      where: {
        userId: secondaryProfileId
      },
      data: {
        userId: primaryProfileId
      }
    }),
    prisma.verifiedEmail.updateMany({
      where: {
        userId: secondaryProfileId
      },
      data: {
        userId: primaryProfileId
      }
    }),
    prisma.googleAccount.updateMany({
      where: {
        userId: secondaryProfileId
      },
      data: {
        userId: primaryProfileId
      }
    }),
    prisma.farcasterUser.updateMany({
      where: {
        userId: secondaryProfileId
      },
      data: {
        userId: primaryProfileId
      }
    }),
    prisma.project.updateMany({
      where: {
        createdBy: secondaryProfileId
      },
      data: {
        createdBy: primaryProfileId
      }
    }),
    prisma.projectMember.updateMany({
      where: {
        userId: secondaryProfileId
      },
      data: {
        userId: primaryProfileId
      }
    }),
    prisma.pagePermission.updateMany({
      where: {
        userId: secondaryProfileId
      },
      data: {
        userId: primaryProfileId
      }
    }),
    prisma.comment.updateMany({
      where: {
        userId: secondaryProfileId
      },
      data: {
        userId: primaryProfileId
      }
    }),
    prisma.thread.updateMany({
      where: {
        userId: secondaryProfileId
      },
      data: {
        userId: primaryProfileId
      }
    }),
    prisma.application.updateMany({
      where: {
        createdBy: secondaryProfileId
      },
      data: {
        createdBy: primaryProfileId
      }
    }),
    prisma.block.updateMany({
      where: {
        createdBy: secondaryProfileId
      },
      data: {
        createdBy: primaryProfileId
      }
    }),
    prisma.bounty.updateMany({
      where: {
        createdBy: secondaryProfileId
      },
      data: {
        createdBy: primaryProfileId
      }
    }),
    prisma.proposal.updateMany({
      where: {
        createdBy: secondaryProfileId
      },
      data: {
        createdBy: primaryProfileId
      }
    }),
    prisma.proposalAppealReviewer.updateMany({
      where: {
        userId: secondaryProfileId
      },
      data: {
        userId: primaryProfileId
      }
    }),
    prisma.proposalReviewer.updateMany({
      where: {
        userId: secondaryProfileId
      },
      data: {
        userId: primaryProfileId
      }
    }),
    prisma.proposalEvaluation.updateMany({
      where: {
        decidedBy: secondaryProfileId
      },
      data: {
        decidedBy: primaryProfileId
      }
    }),
    prisma.proposalEvaluationReview.updateMany({
      where: {
        reviewerId: secondaryProfileId
      },
      data: {
        reviewerId: primaryProfileId
      }
    }),
    prisma.proposalEvaluationAppealReview.updateMany({
      where: {
        reviewerId: secondaryProfileId
      },
      data: {
        reviewerId: primaryProfileId
      }
    }),
    prisma.proposalEvaluationPermission.updateMany({
      where: {
        userId: secondaryProfileId
      },
      data: {
        userId: primaryProfileId
      }
    }),
    prisma.space.updateMany({
      where: {
        createdBy: secondaryProfileId
      },
      data: {
        createdBy: primaryProfileId
      }
    }),
    prisma.post.updateMany({
      where: {
        createdBy: secondaryProfileId
      },
      data: {
        createdBy: primaryProfileId
      }
    }),
    prisma.telegramUser.updateMany({
      where: {
        userId: secondaryProfileId
      },
      data: {
        userId: primaryProfileId
      }
    }),
    prisma.userGnosisSafe.updateMany({
      where: {
        userId: secondaryProfileId
      },
      data: {
        userId: primaryProfileId
      }
    })
  ]);
  log.debug('results', {
    'page.createdBy': results[0],
    'page.updatedBy': results[1],
    'page.deletedBy': results[2],
    'user.deletedAt': results[3].deletedAt,
    'spaceRole.userId': results[4],
    'userWallet.userId': results[5],
    'verifiedEmail.userId': results[6],
    'googleAccount.userId': results[7],
    'farcasterUser.userId': results[8],
    'project.createdBy': results[9],
    'projectMember.userId': results[10],
    'pagePermission.userId': results[11],
    'comment.userId': results[12],
    'thread.userId': results[13],
    'application.createdBy': results[14],
    'block.createdBy': results[15],
    'bounty.createdBy': results[16],
    'proposal.createdBy': results[17],
    'proposalAppealReviewer.userId': results[18],
    'proposalReviewer.userId': results[19],
    'proposalEvaluation.decidedBy': results[20],
    'proposalEvaluationReview.reviewerId': results[21],
    'proposalEvaluationAppealReview.reviewerId': results[22],
    'proposalEvaluationPermission.userId': results[23],
    'space.createdBy': results[24],
    'post.createdBy': results[25],
    'telegramUser.userId': results[26],
    'userGnosisSafe.userId': results[27]
  });
}
