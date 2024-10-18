import { Prisma, prisma } from '@charmverse/core/prisma-client';
import { BoardFields, IPropertyTemplate, PropertyType } from 'lib/databases/board';

function isEvaluationProperty(type: PropertyType) {
  return (
    type === 'proposalRubricCriteriaTotal' ||
    type === 'proposalEvaluatedBy' ||
    type === 'proposalEvaluationTotal' ||
    type === 'proposalEvaluationAverage'
  );
}

export async function updateProposalSourceBoardCardProperties() {
  const proposalSourceBoards = await prisma.block.findMany({
    where: {
      type: 'board',
      fields: {
        path: ['sourceType'],
        equals: 'proposals'
      }
    },
    select: {
      spaceId: true,
      id: true,
      fields: true
    }
  });

  let count = 0;
  const total = proposalSourceBoards.length;

  for (const proposalSourceBoard of proposalSourceBoards) {
    try {
      const fields = proposalSourceBoard.fields as unknown as BoardFields;
      const cardProperties = fields.cardProperties ?? [];
      const evaluationProperties = cardProperties.filter((cardProperty) => isEvaluationProperty(cardProperty.type));
      if (evaluationProperties.length) {
        const rubricCriteriaTotalProperties = Array.from(
          new Set(
            cardProperties
              .filter((cardProperty) => cardProperty.type === 'proposalRubricCriteriaTotal')
              .map((property) => property.name)
          )
        );
        const rubricCriterias = await prisma.proposalRubricCriteria.findMany({
          where: {
            evaluation: {
              proposal: {
                spaceId: proposalSourceBoard.spaceId
              }
            },
            title: {
              in: rubricCriteriaTotalProperties
            }
          },
          select: {
            title: true,
            evaluation: {
              select: {
                title: true
              }
            }
          }
        });
        const rubricCriterialRecords: Record<string, string> = {};
        rubricCriterias.forEach((rubricCriteria) => {
          rubricCriterialRecords[rubricCriteria.title] = rubricCriteria.evaluation.title;
        });
        const { fields: _fields } = await prisma.block.update({
          where: {
            id: proposalSourceBoard.id
          },
          data: {
            fields: {
              ...fields,
              cardProperties: cardProperties.map((cardProperty) => {
                const evaluationProperty = isEvaluationProperty(cardProperty.type);
                if (evaluationProperty) {
                  return {
                    ...cardProperty,
                    private: true,
                    criteriaTitle: cardProperty.type === 'proposalRubricCriteriaTotal' ? cardProperty.name : undefined,
                    evaluationTitle:
                      cardProperty.type === 'proposalRubricCriteriaTotal'
                        ? rubricCriterialRecords[cardProperty.name]
                        : cardProperty.name
                  } as IPropertyTemplate;
                }

                return cardProperty;
              })
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

updateProposalSourceBoardCardProperties();
