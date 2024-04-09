import { prisma } from '@charmverse/core/prisma-client';

import type { BlockWithDetails } from '../block';

import { generateResyncedProposalEvaluationForCard } from './generateResyncedProposalEvaluationForCard';
import { getCardPropertiesFromAnswers } from './getCardPropertiesFromAnswers';

export type ProposalCardData = Pick<BlockWithDetails, 'fields'>;

export async function getProposalsAsCards({
  boardId,
  spaceId
}: {
  boardId: string;
  spaceId: string;
}): Promise<Record<string, ProposalCardData>> {
  // first, get proposals with all the populated information
  // then calculate the card properties for each proposal
  return {};
}

type ProposalData = {
  proposal: {
    id: string;
  };
};

function mapProposalToCard({ proposal }: ProposalData): BlockWithDetails {
  const formFieldProperties = getCardPropertiesFromAnswers({
    accessPrivateFields: true,
    cardProperties: boardBlockCardProperties,
    formFields,
    proposalId: pageProposal.proposal!.id
  });

  proposal?.evaluations.forEach((evaluation) => {
    if (evaluation.type === 'rubric') {
      properties = generateResyncedProposalEvaluationForCard({
        step: evaluation,
        templates: boardBlock.fields.cardProperties,
        properties,
        rubricAnswers:
          (mappedRubricAnswersByProposal[
            pageProposal.proposal!.id
          ] as ProposalRubricCriteriaAnswerWithTypedResponse[]) ?? [],
        rubricCriteria: (mappedRubricCriteriaByProposal[pageProposal.proposal!.id] as RubricCriteriaTyped[]) ?? []
      });
    }
  });
  return {
    properties,
    formFieldProperties
  };
}
