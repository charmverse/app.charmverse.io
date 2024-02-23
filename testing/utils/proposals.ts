import type {
  Page,
  Proposal,
  ProposalAuthor,
  ProposalOperation,
  ProposalReviewer,
  ProposalStatus
} from '@charmverse/core/prisma';
import { ProposalSystemRole, prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped, WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { v4 as uuid } from 'uuid';

import { createPage as createPageDb } from 'lib/pages/server/createPage';
import type { ProposalFields } from 'lib/proposal/interface';

export type ProposalWithUsersAndPageMeta = Omit<Proposal, 'fields'> & {
  authors: ProposalAuthor[];
  fields: ProposalFields | null;
  reviewers: ProposalReviewer[];
  rewardIds?: string[] | null;
  page: Pick<Page, 'title' | 'path'>;
};

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

  const result = await createPageDb<{ proposal: ProposalWithUsersAndPageMeta; title: string; path: string }>({
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

  return { ...result.proposal, page: { title: result.title, path: result.path } };
}

/**
 * Generate a workflow which space members can always view, and has 3 steps: Feedback, Rubric, Vote
 */
export async function generateProposalWorkflow({
  spaceId,
  title
}: {
  spaceId: string;
  title?: string;
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
      title: title ?? `Workflow ${existingFlows + 1}`,
      space: {
        connect: {
          id: spaceId
        }
      },
      evaluations: [
        {
          id: uuid(),
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
          id: uuid(),
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
          id: uuid(),
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
      ] as WorkflowEvaluationJson[]
    }
  }) as any as Promise<ProposalWorkflowTyped>;
}
