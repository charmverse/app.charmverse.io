import type {
  FormFieldAnswer,
  IssuedCredential,
  Prisma,
  Proposal,
  ProposalEvaluation,
  ProposalReviewer,
  ProposalRubricCriteria,
  ProposalRubricCriteriaAnswer
} from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@packages/core/proposals';
import type {
  IssuableProposalCredentialAuthor,
  IssuableProposalCredentialSpace,
  ProposalWithJoinedData
} from '@packages/credentials/findIssuableProposalCredentials';
import { generateCredentialInputsForProposal } from '@packages/credentials/findIssuableProposalCredentials';
import { PROPOSAL_REVIEWERS_BLOCK_ID } from '@packages/lib/proposals/blocks/constants';
import type { ProposalPropertyValue } from '@packages/lib/proposals/blocks/interfaces';
import { getCurrentStep } from '@packages/lib/proposals/getCurrentStep';
import type { ProposalFields } from '@packages/lib/proposals/interfaces';

import type { BlockWithDetails } from '../block';
import type { BoardFields, IPropertyTemplate, ProposalPropertyType } from '../board';
import { proposalPropertyTypesList } from '../board';
import type { CardPropertyValue } from '../card';

import type { FormAnswerData } from './getCardPropertiesFromForm';
import { getCardPropertiesFromForm } from './getCardPropertiesFromForm';
import type { ProjectInformation } from './getCardPropertiesFromProject';
import { getCardPropertiesFromProject } from './getCardPropertiesFromProject';
import { getCardPropertiesFromRubric } from './getCardPropertiesFromRubric';

export type ProposalCardData = Pick<BlockWithDetails, 'fields' | 'title'>;

export type ProposalData = {
  page: {
    id: string;
    title: string;
    path: string;
    sourceTemplateId: string | null;
  };
  proposal: Pick<Proposal, 'fields' | 'formId' | 'id' | 'status' | 'selectedCredentialTemplates' | 'publishedAt'> & {
    authors: ({ userId: string } & IssuableProposalCredentialAuthor)[];
    evaluations: (Pick<
      ProposalEvaluation,
      'id' | 'index' | 'result' | 'title' | 'type' | 'requiredReviews' | 'finalStep' | 'appealedAt' | 'dueDate'
    > & {
      reviewers: ProposalReviewer[];
      rubricAnswers: ProposalRubricCriteriaAnswer[];
      rubricCriteria: ProposalRubricCriteria[];
    })[];
    formAnswers: Pick<FormFieldAnswer, 'fieldId' | 'value'>[];
    issuedCredentials: IssuedCredential[];
    rewards: { id: string }[];
    project: ProjectInformation | null;
  };
  cardProperties: IPropertyTemplate[];
  space: IssuableProposalCredentialSpace;
};

const pageSelectObject = {
  id: true,
  path: true,
  title: true,
  proposal: {
    select: {
      id: true,
      publishedAt: true,
      authors: {
        select: {
          userId: true,
          author: {
            select: {
              id: true,
              wallets: true,
              primaryWallet: true
            }
          }
        }
      },
      selectedCredentialTemplates: true,
      fields: true,
      formId: true,
      formAnswers: {
        select: {
          fieldId: true,
          value: true
        }
      },
      project: {
        include: {
          projectMembers: true
        }
      },
      status: true,
      issuedCredentials: true,
      evaluations: {
        select: {
          id: true,
          index: true,
          result: true,
          title: true,
          type: true,
          rubricCriteria: true,
          rubricAnswers: true,
          requiredReviews: true,
          finalStep: true,
          appealedAt: true,
          reviewers: true,
          dueDate: true
        },
        orderBy: {
          index: 'asc'
        }
      },
      rewards: {
        select: {
          id: true
        }
      }
    }
  },
  sourceTemplateId: true
} satisfies Prisma.PageSelect;

export async function getCardPropertiesFromProposals({
  cardProperties,
  space
}: {
  cardProperties: IPropertyTemplate[];
  space: IssuableProposalCredentialSpace;
}): Promise<Record<string, ProposalCardData>> {
  const proposalPages = await prisma.page.findMany({
    where: {
      spaceId: space.id,
      type: 'proposal',
      proposal: {
        archived: {
          not: true
        },
        status: {
          not: 'draft'
        }
      },
      deletedAt: null
    },
    select: pageSelectObject
  });

  return proposalPages.reduce<Record<string, ProposalCardData>>((acc, { proposal, ...page }) => {
    if (proposal) {
      acc[page.id] = getCardProperties({
        page,
        proposal,
        cardProperties,
        space
      });
    }
    return acc;
  }, {});
}

export async function getCardPropertiesFromProposal({
  boardId,
  pageId,
  space
}: {
  boardId: string;
  pageId: string;
  space: IssuableProposalCredentialSpace;
}) {
  const [boardBlock, { proposal, ...page }] = await Promise.all([
    prisma.block.findFirstOrThrow({ where: { id: boardId } }),
    prisma.page.findFirstOrThrow({
      where: {
        id: pageId
      },
      select: pageSelectObject
    })
  ]);
  if (!proposal) {
    throw new Error('Proposal not found');
  }

  return {
    boardBlock,
    card: getCardProperties({
      cardProperties: (boardBlock.fields as any as BoardFields).cardProperties,
      proposal,
      page,
      space
    })
  };
}

function getCardProperties({ page, proposal, cardProperties, space }: ProposalData): ProposalCardData {
  const proposalProps = getCardPropertyTemplates({ cardProperties });

  let properties: Record<string, ProposalPropertyValue> = {};

  if (proposalProps.proposalUrl) {
    properties[proposalProps.proposalUrl.id] = page.path;
  }

  cardProperties.forEach((cardProperty) => {
    if (!proposalPropertyTypesList.includes(cardProperty.type as ProposalPropertyType)) {
      const proposalFieldValue = (proposal.fields as ProposalFields)?.properties?.[cardProperty.id];
      if (proposalFieldValue !== null && proposalFieldValue !== undefined) {
        properties[cardProperty.id] = proposalFieldValue as CardPropertyValue;
      }
    }
  });

  const filteredTemplates = proposal.selectedCredentialTemplates.filter((selectedTemplateId) =>
    space.credentialTemplates.some((t) => t.id === selectedTemplateId)
  );

  proposal.selectedCredentialTemplates = filteredTemplates;

  const pendingCredentials = generateCredentialInputsForProposal({
    proposal: { ...proposal, page: { id: page.id } } as ProposalWithJoinedData,
    space
  });

  const currentStep = getCurrentStep({
    evaluations: proposal.evaluations,
    hasPendingRewards: ((proposal.fields as ProposalFields)?.pendingRewards ?? []).length > 0,
    proposalStatus: proposal.status,
    hasPublishedRewards: proposal.rewards.length > 0,
    credentialsEnabled: !!proposal.selectedCredentialTemplates.length,
    hasPendingCredentials:
      !!pendingCredentials.length ||
      (!space.useOnchainCredentials &&
        proposal.selectedCredentialTemplates.some(
          (cred) => !proposal.issuedCredentials.some((issuedCred) => issuedCred.credentialTemplateId === cred)
        ))
  });

  if (currentStep && proposalProps.proposalStatus) {
    properties[proposalProps.proposalStatus.id] = currentStep.result ?? 'in_progress';
  }

  if (currentStep && proposalProps.proposalEvaluationType) {
    properties[proposalProps.proposalEvaluationType.id] = currentStep.step;
  }

  if (currentStep && proposalProps.proposalStep) {
    properties[proposalProps.proposalStep.id] = currentStep.title;
  }

  if (proposalProps.proposalAuthor) {
    properties[proposalProps.proposalAuthor.id] = proposal.authors.map((author) => author.userId);
  }

  if (proposalProps.proposalPublishedAt) {
    properties[proposalProps.proposalPublishedAt.id] = proposal.publishedAt?.getTime() ?? '';
  }

  if (proposalProps.proposalEvaluationDueDate) {
    const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
    properties[proposalProps.proposalEvaluationDueDate.id] = currentEvaluation?.dueDate?.getTime() ?? '';
  }

  properties = getCardPropertiesFromRubric({
    properties,
    evaluations: proposal.evaluations.filter((e) => e.type === 'rubric'),
    cardProperties,
    templateId: page.sourceTemplateId
  });

  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);

  properties[PROPOSAL_REVIEWERS_BLOCK_ID] = (currentEvaluation?.reviewers ?? []).map(
    ({ userId, roleId, systemRole }) => ({ userId, roleId, systemRole })
  );

  const formFieldProperties = getCardPropertiesFromForm({
    cardProperties,
    formAnswers: proposal.formAnswers as FormAnswerData[]
  });

  if (proposal.project) {
    Object.assign(properties, getCardPropertiesFromProject(proposal.project));
  }

  return {
    title: page.title,
    fields: {
      properties: {
        ...properties,
        ...formFieldProperties
      }
    }
  };
}

export function getCardPropertyTemplates({ cardProperties }: { cardProperties: IPropertyTemplate[] }) {
  return {
    proposalAuthor: cardProperties.find((prop) => prop.type === 'proposalAuthor'),
    proposalEvaluationType: cardProperties.find((prop) => prop.type === 'proposalEvaluationType'),
    proposalStatus: cardProperties.find((prop) => prop.type === 'proposalStatus'),
    proposalStep: cardProperties.find((prop) => prop.type === 'proposalStep'),
    proposalUrl: cardProperties.find((prop) => prop.type === 'proposalUrl'),
    proposalReviewer: cardProperties.find((prop) => prop.type === 'proposalReviewer'),
    proposalPublishedAt: cardProperties.find((prop) => prop.type === 'proposalPublishedAt'),
    proposalEvaluationDueDate: cardProperties.find((prop) => prop.type === 'proposalEvaluationDueDate')
  };
}
