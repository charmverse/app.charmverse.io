import type {
  Proposal,
  ProposalEvaluation,
  ProposalRubricCriteria,
  ProposalRubricCriteriaAnswer
} from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { getCurrentStep } from 'lib/proposals/getCurrentStep';
import type { ProposalFields } from 'lib/proposals/interfaces';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposals/rubric/interfaces';
import { isTruthy } from 'lib/utils/types';

import type { BlockWithDetails } from '../block';
import type { BoardFields, IPropertyTemplate, ProposalPropertyType } from '../board';
import { proposalPropertyTypesList } from '../board';
import type { CardPropertyValue } from '../card';

import type { FormFieldData, FormAnswerData } from './getCardPropertiesFromForm';
import { getCardPropertiesFromForm } from './getCardPropertiesFromForm';
import { getCardPropertiesFromRubric } from './getCardPropertiesFromRubric';

export type ProposalCardData = Pick<BlockWithDetails, 'fields' | 'title'>;

const pageSelectObject = {
  id: true,
  path: true,
  title: true,
  proposal: {
    select: {
      id: true,
      authors: true,
      fields: true,
      formId: true,
      formAnswers: true,
      status: true,
      evaluations: {
        select: {
          id: true,
          index: true,
          result: true,
          title: true,
          type: true,
          rubricCriteria: true,
          rubricAnswers: true
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
  }
} as const;

export async function getCardPropertiesFromProposals({
  cardProperties,
  spaceId
}: {
  cardProperties: IPropertyTemplate[];
  spaceId: string;
}): Promise<Record<string, ProposalCardData>> {
  const proposalPages = await prisma.page.findMany({
    where: {
      spaceId,
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

  const formIds = Array.from(new Set(proposalPages.map((p) => p.proposal?.formId))).filter(isTruthy);
  const formFields = await prisma.formField.findMany({
    where: {
      formId: {
        in: formIds
      }
    },
    select: {
      formId: true,
      id: true,
      type: true,
      private: true
    },
    orderBy: {
      index: 'asc'
    }
  });

  return proposalPages.reduce<Record<string, ProposalCardData>>((acc, { proposal, ...page }) => {
    if (proposal) {
      acc[page.id] = getCardProperties({
        page,
        proposal,
        cardProperties,
        formFields: formFields.filter((formField) => formField.formId === proposal.formId)
      });
    }
    return acc;
  }, {});
}

export async function getCardPropertiesFromProposal({ boardId, pageId }: { boardId: string; pageId: string }) {
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
  const formFields = proposal.formId
    ? await prisma.formField.findMany({
        where: {
          formId: proposal.formId
        },
        select: {
          formId: true,
          id: true,
          type: true,
          private: true
        },
        orderBy: {
          index: 'asc'
        }
      })
    : [];

  return {
    boardBlock,
    card: getCardProperties({
      cardProperties: (boardBlock.fields as any as BoardFields).cardProperties,
      formFields,
      proposal,
      page
    })
  };
}

type ProposalData = {
  page: {
    title: string;
    path: string;
  };
  proposal: Pick<Proposal, 'fields' | 'formId' | 'id' | 'status'> & {
    authors: { userId: string }[];
    evaluations: (Pick<ProposalEvaluation, 'id' | 'index' | 'result' | 'title' | 'type'> & {
      rubricAnswers: ProposalRubricCriteriaAnswer[];
      rubricCriteria: ProposalRubricCriteria[];
    })[];
    formAnswers: FormAnswerData[];
    rewards: { id: string }[];
  };
  formFields: FormFieldData[];
  cardProperties: IPropertyTemplate[];
};

function getCardProperties({ page, proposal, cardProperties, formFields }: ProposalData): ProposalCardData {
  const proposalProps = getCardPropertyTemplates({ cardProperties });

  let properties: Record<string, CardPropertyValue> = {};

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

  const currentStep = getCurrentStep({
    evaluations: proposal.evaluations,
    hasPendingRewards: ((proposal.fields as ProposalFields)?.pendingRewards ?? []).length > 0,
    proposalStatus: proposal.status,
    hasPublishedRewards: proposal.rewards.length > 0
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

  proposal.evaluations.forEach((evaluation) => {
    if (evaluation.type === 'rubric') {
      properties = getCardPropertiesFromRubric({
        properties,
        rubricAnswers: evaluation.rubricAnswers as ProposalRubricCriteriaAnswerWithTypedResponse[],
        rubricCriteria: evaluation.rubricCriteria,
        step: evaluation,
        templates: cardProperties
      });
    }
  });

  const formFieldProperties = getCardPropertiesFromForm({
    cardProperties,
    formAnswers: proposal.formAnswers,
    formFields
  });

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
    proposalUrl: cardProperties.find((prop) => prop.type === 'proposalUrl')
  };
}
