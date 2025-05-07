import { prisma } from '@charmverse/core/prisma-client';

import type { Board } from '../board';
import type { BoardViewFields } from '../boardView';

export async function updateViews({ board }: { board: Board }) {
  const views = await prisma.block.findMany({
    where: {
      type: 'view',
      parentId: board.id
    }
  });
  const cardProperties = board.fields.cardProperties;
  const proposalEvaluationTypeProperty = cardProperties.find(
    (cardProperty) => cardProperty.type === 'proposalEvaluationType'
  );

  return prisma.$transaction(
    views.map((block) => {
      return prisma.block.update({
        where: { id: block.id },
        data: {
          fields: {
            ...(block.fields as BoardViewFields),
            // Hide the proposal evaluation type property from the view
            visiblePropertyIds: [
              ...new Set([...(block.fields as BoardViewFields).visiblePropertyIds, ...cardProperties.map((p) => p.id)])
            ].filter((id) => id !== proposalEvaluationTypeProperty?.id),
            sourceType: 'proposals'
          }
        }
      });
    })
  );
}
