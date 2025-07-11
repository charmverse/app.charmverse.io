import type { PageType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@packages/core/proposals';
import type { BoardFields } from '@packages/databases/board';
import { createDefaultProjectAndMembersFieldConfig } from '@packages/lib/projects/formField';
import type { FormFieldInput } from '@packages/lib/proposals/forms/interfaces';
import type { ProposalFields } from '@packages/lib/proposals/interfaces';
import type { RubricCriteriaTyped } from '@packages/lib/proposals/rubric/interfaces';
import { generatePagePathFromPathAndTitle } from '@packages/pages/utils';
import { v4 as uuid } from 'uuid';

import type { ProposalEvaluationInput } from './createProposal';
import { createProposal } from './createProposal';
import type { VoteSettings } from './interfaces';
import type { RubricDataInput } from './rubric/upsertRubricCriteria';
import { getNewCriteria } from './workflows/getNewCriteria';

export type ProposalContentType = 'structured' | 'free_form';

export type CreateDraftProposalInput = {
  createdBy: string;
  spaceId: string;
  contentType?: ProposalContentType;
  pageType?: Extract<PageType, 'proposal_template' | 'proposal'>;
  title?: string;
  templateId?: string;
  sourcePageId?: string;
  sourcePostId?: string;
  authors?: string[];
  makeRewardsPublic?: boolean;
};

export async function createDraftProposal(input: CreateDraftProposalInput) {
  const { templateId } = input;

  if (templateId) {
    // Make sure that the template doesn't belong to an archived workflow
    await prisma.proposal.findUniqueOrThrow({
      where: {
        id: templateId,
        workflow: {
          archived: false
        }
      }
    });
  }

  // get source data
  const [template, sourcePage, sourcePost, proposalBoardBlock] = await Promise.all([
    input.templateId
      ? await prisma.page.findUniqueOrThrow({
          where: {
            id: input.templateId
          },
          include: {
            proposal: {
              include: {
                authors: true,
                form: {
                  include: {
                    formFields: true
                  }
                },
                evaluations: {
                  include: {
                    reviewers: true,
                    appealReviewers: true,
                    evaluationApprovers: true,
                    rubricCriteria: true
                  },
                  orderBy: {
                    index: 'asc'
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
      : null,
    prisma.proposalBlock.findUnique({
      where: {
        id_spaceId: {
          id: '__defaultBoard',
          spaceId: input.spaceId
        }
      }
    })
  ]);

  const workflow =
    template?.proposal?.workflow ||
    (await prisma.proposalWorkflow.findFirstOrThrow({
      where: {
        spaceId: input.spaceId
      }
    }));

  if (template && !workflow) {
    throw new Error('Template has no workflow assigned');
  }

  // authors should be empty by default for new templates
  // but include authors from templates if they were added
  const authorsFromTemplate = template?.proposal?.authors.map(({ userId }) => userId) || [];
  const authors: string[] =
    input.pageType === 'proposal_template'
      ? [...(input.authors ?? [])]
      : [...new Set([...(input.authors ?? []), input.createdBy].concat(authorsFromTemplate))];

  const evaluations: ProposalEvaluationInput[] =
    template?.proposal?.evaluations.map((evaluation) => ({
      ...evaluation,
      notificationLabels: evaluation.notificationLabels as WorkflowEvaluationJson['notificationLabels'],
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
        appealReviewers: evaluation.appealable ? [] : undefined,
        reviewers: evaluation.type === 'feedback' ? [{ systemRole: 'author' as const }] : [],
        rubricCriteria
      };
    });

  const templateFields = template?.proposal?.fields as ProposalFields | undefined;
  const fields: ProposalFields = {
    properties: {},
    enableRewards: true,
    ...(templateFields || {}),
    pendingRewards: []
  };

  // dont create properties that were deleted
  if (proposalBoardBlock && fields.properties) {
    (proposalBoardBlock.fields as unknown as BoardFields).cardProperties.forEach((property) => {
      if (property.deletedAt) {
        delete fields.properties![property.id];
      }
    });
  }

  let formFields: FormFieldInput[] = [];
  if (input.pageType === 'proposal_template' && template?.proposal?.form) {
    formFields = template.proposal.form.formFields.map(
      ({ id, ...item }) =>
        ({
          ...item,
          description: item.description ?? '',
          fieldConfig: {}
        }) as any as FormFieldInput
    );
  } else if (input.contentType === 'structured') {
    formFields = [
      {
        type: 'project_profile',
        name: '',
        description: null,
        index: 0,
        options: [],
        private: false,
        required: true,
        id: uuid(),
        fieldConfig: createDefaultProjectAndMembersFieldConfig({ allFieldsRequired: true }),
        dependsOnStepIndex: null
      }
    ];
  }

  return createProposal({
    authors,
    evaluations,
    fields,
    formFields,
    formId: template?.proposal?.formId || undefined,
    workflowId: workflow.id,
    isDraft: true,
    pageProps: {
      content: template?.content || sourcePage?.content || sourcePost?.content || null,
      contentText: template?.contentText || sourcePage?.contentText || sourcePost?.contentText || '',
      path: generatePagePathFromPathAndTitle({ title: 'page' }),
      sourceTemplateId: template?.id || undefined,
      title: input.title || sourcePage?.title || sourcePost?.title || '',
      type: input.pageType || 'proposal'
    },
    selectedCredentialTemplates: template?.proposal?.selectedCredentialTemplates || undefined,
    spaceId: input.spaceId,
    userId: input.createdBy,
    sourcePostId: input.sourcePostId,
    sourcePageId: input.sourcePageId
  });
}
