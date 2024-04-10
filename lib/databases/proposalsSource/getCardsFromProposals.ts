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

import type { BlockWithDetails } from '../block';
import type { IPropertyTemplate, ProposalPropertyType } from '../board';
import { proposalPropertyTypesList } from '../board';
import type { CardPropertyValue } from '../card';

import { generateResyncedProposalEvaluationForCard } from './generateResyncedProposalEvaluationForCard';
import type { FormFieldData } from './getCardPropertiesFromAnswers';
import { getCardPropertiesFromAnswers } from './getCardPropertiesFromAnswers';
import { getProposalSourceProperties } from './getProposalSourceProperties';

export type ProposalCardData = Pick<BlockWithDetails, 'fields' | 'title'>;

export async function getCardsFromProposals({
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
    select: {
      id: true,
      path: true,
      title: true,
      proposal: {
        select: {
          id: true,
          authors: true,
          fields: true,
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
          },
          form: {
            select: {
              formFields: {
                select: {
                  id: true,
                  type: true,
                  private: true,
                  answers: {
                    select: {
                      proposalId: true,
                      value: true
                    }
                  }
                },
                orderBy: {
                  index: 'asc'
                }
              }
            }
          }
        }
      }
    }
  });

  return proposalPages.reduce<Record<string, ProposalCardData>>((acc, proposalPage) => {
    if (proposalPage.proposal) {
      acc[proposalPage.id] = mapProposalToCard({
        page: proposalPage,
        proposal: proposalPage.proposal,
        cardProperties
      });
    }
    return acc;
  }, {});
}

type ProposalData = {
  page: {
    title: string;
    path: string;
  };
  proposal: Pick<Proposal, 'fields' | 'id' | 'status'> & {
    authors: { userId: string }[];
    evaluations: (Pick<ProposalEvaluation, 'id' | 'index' | 'result' | 'title' | 'type'> & {
      rubricAnswers: ProposalRubricCriteriaAnswer[];
      rubricCriteria: ProposalRubricCriteria[];
    })[];
    rewards: { id: string }[];
    form: null | {
      formFields: FormFieldData[];
    };
  };
  cardProperties: IPropertyTemplate[];
};

function mapProposalToCard({ page, proposal, cardProperties }: ProposalData): ProposalCardData {
  const proposalProps = getProposalSourceProperties({ cardProperties });

  let properties: Record<string, CardPropertyValue> = {};

  if (proposalProps.proposalUrl) {
    properties[proposalProps.proposalUrl.id] = page.path;
  }

  cardProperties.forEach((cardProperty) => {
    if (!proposalPropertyTypesList.includes(cardProperty.type as ProposalPropertyType)) {
      const proposalFieldValue = (proposal.fields as ProposalFields)?.properties?.[cardProperty.id];
      if (proposalFieldValue) {
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
      properties = generateResyncedProposalEvaluationForCard({
        step: evaluation,
        templates: cardProperties,
        properties,
        rubricAnswers: evaluation.rubricAnswers as ProposalRubricCriteriaAnswerWithTypedResponse[],
        rubricCriteria: evaluation.rubricCriteria
      });
    }
  });

  const formFields = proposal.form?.formFields ?? [];
  const formFieldProperties = getCardPropertiesFromAnswers({
    accessPrivateFields: true,
    cardProperties,
    formFields,
    proposalId: proposal.id
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
