import { Prisma, prisma } from '@charmverse/core/prisma-client';
import { BoardFields } from 'lib/databases/board';

export async function deleteRubricCriteriaTotalProperties() {
  const proposalSourceBoards = await prisma.block.findMany({
    where: {
      fields: {
        path: ['sourceType'],
        equals: 'proposals'
      }
    },
    select: {
      id: true,
      fields: true
    }
  })

  let count = 0;
  const total = proposalSourceBoards.length;

  for (const proposalSourceBoard of proposalSourceBoards) {
    try {
      const fields = proposalSourceBoard.fields as unknown as BoardFields;
      const cardProperties = fields.cardProperties ?? [];
      const rubricCriteriaTotalProperties = cardProperties.filter((cardProperty) => cardProperty.type === 'proposalRubricCriteriaTotal');
      if (rubricCriteriaTotalProperties.length) {
        await prisma.block.update({
          where: {
            id: proposalSourceBoard.id
          },
          data: {
            fields: {
              ...fields,
              cardProperties: cardProperties.filter((cardProperty) => cardProperty.type !== 'proposalRubricCriteriaTotal')
            } as unknown as Prisma.JsonObject
          }
        });
      }
    } catch (err) {
      console.error('Error in board:', proposalSourceBoard.id, {
        err
      });
    } finally {
      count++;
      console.log('Processed', count, 'out of', total);
    }
  }
}

deleteRubricCriteriaTotalProperties();
