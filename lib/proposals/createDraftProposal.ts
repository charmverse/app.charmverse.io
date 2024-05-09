import type { PageType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { v4 as uuid } from 'uuid';

import { generatePagePathFromPathAndTitle } from 'lib/pages/utils';
import { createDefaultProjectAndMembersFieldConfig } from 'lib/projects/formField';
import type { ProposalFields } from 'lib/proposals/interfaces';
import type { RubricCriteriaTyped } from 'lib/proposals/rubric/interfaces';
import { prettyPrint } from 'lib/utils/strings';

import type { ProposalEvaluationInput } from './createProposal';
import { createProposal } from './createProposal';
import type { VoteSettings } from './interfaces';
import type { RubricDataInput } from './rubric/upsertRubricCriteria';
import { getNewCriteria } from './workflows/getNewCriteria';

export type ProposalContentType = 'structured' | 'free_form';

export type CreateDraftProposalInput = {
  createdBy: string;
  spaceId: string;
  contentType: ProposalContentType;
  pageType?: Extract<PageType, 'proposal_template'>;
  templateId?: string;
  sourcePageId?: string;
  sourcePostId?: string;
};

export async function createDraftProposal(input: CreateDraftProposalInput) {
  // get source data
  const [template, sourcePage, sourcePost] = await Promise.all([
    input.templateId
      ? await prisma.page.findUniqueOrThrow({
          where: {
            id: input.templateId
          },
          include: {
            proposal: {
              include: {
                authors: true,
                evaluations: {
                  include: {
                    reviewers: true,
                    rubricCriteria: true
                  }
                },
                workflow: true
              }
            }
          }
        })
      : null,
    input.sourcePageId
      ? prisma.page.findUniqueOrThrow({
          where: {
            id: input.sourcePageId
          }
        })
      : null,
    input.sourcePostId
      ? prisma.post.findUniqueOrThrow({
          where: {
            id: input.sourcePostId
          }
        })
      : null
  ]);

  const workflow =
    template?.proposal?.workflow ||
    (await prisma.proposalWorkflow.findFirstOrThrow({
      where: {
        spaceId: input.spaceId
      }
    }));

  // authors should be empty by default for new templates
  // but include authors from templates if they were added
  const authorsFromTemplate = template?.proposal?.authors.map(({ userId }) => userId) || [];
  const authors: string[] =
    input.pageType === 'proposal_template' ? [] : [...new Set([input.createdBy].concat(authorsFromTemplate))];

  prettyPrint(template?.proposal?.evaluations);

  const evaluations: ProposalEvaluationInput[] =
    template?.proposal?.evaluations.map((evaluation) => ({
      ...evaluation,
      actionLabels: evaluation.actionLabels as WorkflowEvaluationJson['actionLabels'],
      rubricCriteria: evaluation.rubricCriteria.map((criteria) => ({
        ...criteria,
        parameters: criteria.parameters as RubricDataInput['parameters']
      })),
      voteSettings: evaluation.voteSettings as VoteSettings,
      proposalId: undefined
    })) ||
    (workflow.evaluations as WorkflowEvaluationJson[]).map((evaluation, index) => {
      const rubricCriteria = evaluation.type === 'rubric' ? ([getNewCriteria()] as RubricCriteriaTyped[]) : [];
      return {
        ...evaluation,
        index,
        reviewers: evaluation.type === 'feedback' ? [{ systemRole: 'author' as const }] : [],
        rubricCriteria
      };
    });

  const templateFields = template?.proposal?.fields as ProposalFields | undefined;
  const fields: ProposalFields = {
    properties: {},
    enableRewards: true,
    ...(templateFields || {}),
    pendingRewards: templateFields?.pendingRewards?.map((pendingReward) => ({
      ...pendingReward,
      reward: {
        ...pendingReward.reward,
        assignedSubmitters: authors
      }
    }))
  };

  return createProposal({
    authors,
    evaluations,
    fields,
    formFields:
      input.contentType === 'structured'
        ? [
            {
              type: 'project_profile',
              name: '',
              description: null,
              index: 0,
              options: [],
              private: false,
              required: true,
              id: uuid(),
              fieldConfig: createDefaultProjectAndMembersFieldConfig()
            }
          ]
        : [],
    formId: template?.proposal?.formId || undefined,
    workflowId: workflow.id,
    isDraft: true,
    pageProps: {
      content: template?.content || sourcePage?.content || sourcePost?.content || null,
      contentText: template?.contentText || sourcePage?.contentText || sourcePost?.contentText || '',
      path: generatePagePathFromPathAndTitle({ title: 'page' }),
      sourceTemplateId: template?.id || undefined,
      title: sourcePage?.title || sourcePost?.title || '',
      type: input.pageType || 'proposal'
    },
    selectedCredentialTemplates: template?.proposal?.selectedCredentialTemplates || undefined,
    spaceId: input.spaceId,
    userId: input.createdBy,
    sourcePostId: input.sourcePostId,
    sourcePageId: input.sourcePageId
  });
}
