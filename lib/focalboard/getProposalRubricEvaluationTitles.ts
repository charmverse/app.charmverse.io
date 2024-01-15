import type { Board } from './board';
import type { BoardView } from './boardView';
import type { Card, CardPropertyValue } from './card';

export function getProposalRubricEvaluationTitles({
  cards,
  board,
  boardSourceType
}: {
  boardSourceType?: string;
  board?: Board;
  cards: Card<CardPropertyValue>[];
}) {
  if (boardSourceType !== 'proposals' || !board) {
    return [];
  }

  const proposalEvaluationByProperty = board.fields.cardProperties.find(
    (cardProperty) => cardProperty.type === 'proposalEvaluatedBy'
  );

  if (!proposalEvaluationByProperty) {
    return [];
  }

  const evaluationTitles = Array.from(
    new Set(
      cards
        .map((card) => {
          const proposalEvaluationsReviewers =
            (card.fields?.properties[proposalEvaluationByProperty.id] as unknown as {
              title: string;
              value: string[];
            }[]) ?? [];

          return proposalEvaluationsReviewers.map((proposalEvaluationReviewers) => proposalEvaluationReviewers.title);
        })
        .flat()
    )
  );

  return evaluationTitles;
}
