import type {
  Page,
  Proposal,
  ProposalAuthor,
  ProposalOperation,
  ProposalEvaluation,
  ProposalReviewer,
  ProposalStatus
} from '@charmverse/core/prisma';
import { ProposalSystemRole, prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import type { ProposalWorkflowTyped, WorkflowEvaluationJson, PermissionJson } from '@packages/core/proposals';
import { prismaToBlock } from '@packages/databases/block';
import type { Board } from '@packages/databases/board';
import { updateBoardProperties } from '@packages/databases/proposalsSource/updateBoardProperties';
import { updateViews } from '@packages/databases/proposalsSource/updateViews';
import type { PopulatedEvaluation, ProposalFields } from '@packages/lib/proposals/interfaces';
import { getDefaultPermissions } from '@packages/lib/proposals/workflows/defaultEvaluation';
import { generateBoard } from '@packages/testing/setupDatabase';
import { sortBy } from 'lodash-es';
import { v4 as uuid } from 'uuid';

// import type { SelectedProposalProperties } from '@packages/databases/proposalsSource/interfaces';

export type ProposalWithUsersAndPageMeta = Omit<Proposal, 'fields'> & {
  authors: ProposalAuthor[];
  fields: ProposalFields | null;
  reviewers: ProposalReviewer[];
  rewardIds?: string[] | null;
  page: Pick<Page, 'title' | 'path'>;
};

type GenerateProposalOptions = Parameters<typeof testUtilsProposals.generateProposal>[0];

type TypedEvaluation = ProposalEvaluation & {
  permissions: PermissionJson[];
  reviewers: ProposalReviewer[];
  rubricCriteria: PopulatedEvaluation['rubricCriteria'];
};
export type GenerateProposalResponse = Proposal & {
  authors: ProposalAuthor[];
  reviewers: ProposalReviewer[];
  page: Page;
  evaluations: TypedEvaluation[];
};

/**
 * A wrapper around core lib method, (with changes to be added in core later when we have time)
 */
export async function generateProposalV2({
  selectedCredentialTemplates,
  workflowId,
  ...input
}: GenerateProposalOptions & {
  selectedCredentialTemplates?: string[];
  workflowId?: string;
}): Promise<GenerateProposalResponse> {
  const proposal = await testUtilsProposals.generateProposal(input);
  if (selectedCredentialTemplates) {
    await prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: { selectedCredentialTemplates }
    });
    proposal.selectedCredentialTemplates = selectedCredentialTemplates;
  }
  // every proposal should be part of a workflow
  if (!workflowId) {
    const workflow = await generateProposalWorkflow({
      spaceId: input.spaceId,
      evaluations: sortBy(proposal.evaluations, 'index' as any).map((e) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        permissions: e.permissions.map(({ operation, systemRole, userId, roleId }) => ({
          operation,
          systemRole,
          userId,
          roleId
        }))
      }))
    });
    await prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: { workflowId: workflow.id }
    });
    proposal.workflowId = workflow.id;
  }

  // copied from core lib method
  const result = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposal.id
    },
    include: {
      authors: true,
      reviewers: true,
      page: true,
      evaluations: {
        include: {
          permissions: true,
          reviewers: true,
          rubricCriteria: {
            orderBy: {
              index: 'asc'
            }
          }
        },
        orderBy: {
          index: 'asc'
        }
      }
    }
  });
  return result as unknown as GenerateProposalResponse;
}

/**
 * Creates a proposal with the linked authors and reviewers
 */
export async function generateProposal({
  userId,
  spaceId,
  proposalStatus = 'draft',
  authors = [],
  deletedAt = null
}: {
  deletedAt?: Page['deletedAt'];
  userId: string;
  spaceId: string;
  authors?: string[];
  proposalStatus?: ProposalStatus;
}): Promise<ProposalWithUsersAndPageMeta> {
  const proposalId = uuid();

  const result = await prisma.page.create({
    data: {
      id: proposalId,
      contentText: '',
      path: `path-${uuid()}`,
      title: 'Proposal',
      type: 'proposal',
      author: {
        connect: {
          id: userId
        }
      },
      updatedBy: userId,
      space: {
        connect: {
          id: spaceId
        }
      },
      deletedAt,
      proposal: {
        create: {
          id: proposalId,
          createdBy: userId,
          status: proposalStatus,
          space: {
            connect: {
              id: spaceId
            }
          },
          authors: !authors.length
            ? undefined
            : {
                createMany: {
                  data: authors.map((authorId) => ({ userId: authorId }))
                }
              }
        }
      }
    },
    include: {
      proposal: {
        include: {
          authors: true,
          reviewers: true
        }
      }
    }
  });

  return { ...result.proposal, page: { title: result.title, path: result.path } } as ProposalWithUsersAndPageMeta;
}

/**
 * Generate a workflow which space members can always view, and has 3 steps: Feedback, Rubric, Vote
 */
type OptionalField = 'id' | 'title' | 'permissions';

export async function generateProposalWorkflow({
  spaceId,
  draftReminder,
  title,
  evaluations = []
}: {
  draftReminder?: boolean;
  spaceId: string;
  title?: string;
  evaluations?: (Omit<WorkflowEvaluationJson, OptionalField> & Partial<Pick<WorkflowEvaluationJson, OptionalField>>)[];
}): Promise<ProposalWorkflowTyped> {
  const existingFlows = await prisma.proposalWorkflow.count({
    where: {
      spaceId
    }
  });

  // Default permissions come from lib/proposal/workflows/defaultEvaluation.ts
  return prisma.proposalWorkflow.create({
    data: {
      index: existingFlows,
      draftReminder,
      title: title ?? `Workflow ${existingFlows + 1}`,
      space: {
        connect: {
          id: spaceId
        }
      },
      evaluations: evaluations.map((evaluation) => {
        return {
          id: uuid(),
          title: 'Evaluation step',
          permissions: getDefaultPermissions(),
          ...evaluation
        };
      })
    }
  }) as any as Promise<ProposalWorkflowTyped>;
}

export async function generateProposalWorkflowWithEvaluations(options: {
  spaceId: string;
  title?: string;
}): Promise<ProposalWorkflowTyped> {
  return generateProposalWorkflow({
    ...options,
    evaluations: [
      {
        permissions: [
          // author permissions
          ...['view', 'edit', 'comment', 'move'].map((operation) => ({
            operation: operation as ProposalOperation,
            systemRole: ProposalSystemRole.author
          })),
          // member permissions
          ...['view', 'comment'].map((operation) => ({
            operation: operation as ProposalOperation,
            systemRole: ProposalSystemRole.space_member
          }))
        ],
        title: 'Feedback',
        type: 'feedback'
      },
      {
        permissions: [
          // author permissions
          ...['view', 'edit', 'comment', 'move'].map((operation) => ({
            operation: operation as ProposalOperation,
            systemRole: ProposalSystemRole.author
          })),
          // reviewer permissions
          ...['view', 'comment', 'move'].map((operation) => ({
            operation: operation as ProposalOperation,
            systemRole: ProposalSystemRole.current_reviewer
          })),
          // all reviewers - this is redundant since all members have view/comment access, but we include it as an example for user education
          ...['view', 'comment'].map((operation) => ({
            operation: operation as ProposalOperation,
            systemRole: ProposalSystemRole.all_reviewers
          })),
          // member permissions
          ...['view', 'comment'].map((operation) => ({
            operation: operation as ProposalOperation,
            systemRole: ProposalSystemRole.space_member
          }))
        ],
        title: 'Rubric',
        type: 'rubric'
      },
      {
        permissions: [
          // author permissions
          ...['view', 'edit', 'comment', 'move'].map((operation) => ({
            operation: operation as ProposalOperation,
            systemRole: ProposalSystemRole.author
          })),
          // reviewer permissions
          ...['view', 'comment', 'move'].map((operation) => ({
            operation: operation as ProposalOperation,
            systemRole: ProposalSystemRole.current_reviewer
          })),
          // all reviewers - this is redundant since all members have view/comment access, but we include it as an example for user education
          ...['view', 'comment'].map((operation) => ({
            operation: operation as ProposalOperation,
            systemRole: ProposalSystemRole.all_reviewers
          })),
          // member permissions
          ...['view', 'comment'].map((operation) => ({
            operation: operation as ProposalOperation,
            systemRole: ProposalSystemRole.space_member
          }))
        ],
        title: 'Vote',
        type: 'vote'
      }
    ]
  });
}

export async function generateProposalSourceDb({
  createdBy,
  spaceId,
  selectedProperties
}: {
  createdBy: string;
  spaceId: string;
  selectedProperties?: any; // SelectedProposalProperties;
}) {
  const database = await generateBoard({
    createdBy,
    spaceId,
    views: 1,
    viewDataSource: 'proposals',
    cardCount: 0
  });

  // sync board properties
  const updatedBlock = await updateBoardProperties({ boardId: database.id, selectedProperties });
  const updatedBoard = prismaToBlock(updatedBlock) as Board;
  await updateViews({ board: updatedBoard });
  return updatedBoard;
}
