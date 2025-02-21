import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { prisma } from '@charmverse/core/prisma-client';
import { ProposalFields } from '@root/lib/proposals/interfaces';
import { PageContent } from '@root/lib/prosemirror/interfaces';
import { isTruthy } from '@packages/utils/types';
import { v4 } from 'uuid';

export async function moveBackToLastEvaluation() {
  const pagePath = 'proposal-1-9677341176168139';

  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: {
        path: pagePath
      }
    },
    select: {
      evaluations: {
        orderBy: {
          index: 'asc'
        }
      },
      fields: true
    }
  });
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);

  const lastEvaluationId =
    currentEvaluation?.finalStep ||
    currentEvaluation?.appealedAt ||
    (currentEvaluation?.id === proposal.evaluations.at(-1)?.id && currentEvaluation?.result === 'pass')
      ? currentEvaluation?.id
      : proposal.evaluations.at(-1)?.id;

  if (!lastEvaluationId) {
    throw new Error();
  }

  const rewards = await prisma.bounty.findMany({
    where: {
      proposal: {
        page: {
          path: pagePath
        }
      }
    },
    include: {
      page: true,
      proposal: true,
      permissions: true
    }
  });

  const pendingRewards: ProposalFields['pendingRewards'] = rewards.map((reward) => ({
    page: {
      icon: reward.page!.icon,
      type: reward.page!.type,
      title: reward.page!.title,
      updatedAt: reward.page!.updatedAt,
      contentText: reward.page!.contentText,
      headerImage: reward.page!.headerImage,
      content: reward.page!.content as PageContent
    },
    reward: {
      chainId: reward.chainId,
      rewardType: reward.rewardType,
      rewardToken: reward.rewardToken,
      customReward: reward.customReward,
      rewardAmount: reward.rewardAmount,
      maxSubmissions: reward.maxSubmissions,
      approveSubmitters: reward.approveSubmitters,
      allowMultipleApplications: reward.allowMultipleApplications,
      reviewers: reward.permissions
        .filter((perm) => perm.permissionLevel === 'reviewer')
        .map((perm) => ({
          id: perm.id,
          roleId: perm.roleId,
          userId: perm.userId,
          proposalId: reward.proposal!.id,
          systemRole: null,
          evaluationId: null
        })),
      allowedSubmitterRoles: [],
      assignedSubmitters: reward.permissions
        .filter((perm) => perm.permissionLevel === 'submitter')
        .map((perm) => perm.userId)
        .filter(isTruthy)
    },
    draftId: v4()
  }));

  const proposalFields = proposal.fields as ProposalFields;

  await prisma.$transaction([
    prisma.proposal.updateMany({
      where: {
        page: {
          path: pagePath
        }
      },
      data: {
        fields: {
          ...proposalFields,
          pendingRewards
        }
      }
    }),
    prisma.issuedCredential.deleteMany({
      where: {
        proposal: {
          page: {
            path: pagePath
          }
        }
      }
    }),
    prisma.page.deleteMany({
      where: {
        bounty: {
          proposal: {
            page: {
              path: pagePath
            }
          }
        }
      }
    }),
    prisma.bounty.deleteMany({
      where: {
        proposal: {
          page: {
            path: pagePath
          }
        }
      }
    }),
    prisma.proposalEvaluation.updateMany({
      where: {
        id: lastEvaluationId
      },
      data: {
        result: null,
        decidedBy: null,
        completedAt: null
      }
    })
  ]);
}
