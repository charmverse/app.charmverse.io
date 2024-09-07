import { prisma } from '@charmverse/core/prisma-client';
import {
  RubricEvaluationProperty,
  SelectedProposalProperties
} from 'components/common/DatabaseEditor/components/viewSidebar/viewSourceOptions/components/ProposalSourceProperties/interfaces';
import { BoardFields, IPropertyTemplate } from 'lib/databases/board';
import { defaultProposalPropertyTypes } from 'lib/databases/proposalDbProperties';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/proposals/blocks/constants';
import { projectFieldProperties, projectMemberFieldProperties } from 'lib/projects/formField';
import { isTruthy } from 'lib/utils/types';
import { updateBoardProperties } from 'lib/databases/proposalsSource/updateBoardProperties';

const ProposalPropertyRubricPropertyRecord: Record<string, RubricEvaluationProperty> = {
  proposalEvaluatedBy: 'reviewers',
  proposalEvaluationTotal: 'total',
  proposalEvaluationAverage: 'average',
  proposalRubricCriteriaTotal: 'criteriaTotal',
  proposalRubricCriteriaAverage: 'criteriaAverage',
  proposalRubricCriteriaReviewerScore: 'reviewerScore',
  proposalRubricCriteriaReviewerComment: 'reviewerComment'
};

async function updateProposalSourceDatabaseBoardProperties() {
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
      const cardPropertyIds = cardProperties.map((field) => field.id);

      const proposalBoardBlock = (await prisma.proposalBlock.findUnique({
        where: {
          id_spaceId: {
            id: DEFAULT_BOARD_BLOCK_ID,
            spaceId: proposalSourceBoard.spaceId
          }
        },
        select: {
          fields: true
        }
      })) as null | { fields: BoardFields };
      const proposalCustomProperties = (proposalBoardBlock?.fields.cardProperties ?? []) as IPropertyTemplate[];
      const formFieldProperties = cardProperties.filter((cardProperty) => cardProperty.formFieldId);
      const boardSelectedProperties: SelectedProposalProperties = {
        customProperties: proposalCustomProperties.map((field) => field.id),
        defaults: cardProperties
          .filter((cardProperty) => defaultProposalPropertyTypes.includes(cardProperty.type))
          .map((property) => property.type),
        project: projectFieldProperties
          .filter((property) => cardPropertyIds.includes(property.columnPropertyId))
          .map((property) => property.field),
        projectMember: projectMemberFieldProperties
          .filter((property) => cardPropertyIds.includes(property.columnPropertyId))
          .map((property) => property.field),
        templateProperties: []
      };

      const formFields = await prisma.formField.findMany({
        where: {
          id: {
            in: formFieldProperties.map((property) => property.formFieldId as string)
          }
        },
        select: {
          id: true,
          form: {
            select: {
              proposal: {
                where: {
                  page: {
                    type: 'proposal_template'
                  }
                },
                select: {
                  page: {
                    select: {
                      type: true,
                      id: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      const proposalTemplateIdFormFieldIdsRecord: Record<string, string[]> = {};

      formFields.forEach((formField) => {
        const proposalTemplateId = formField.form.proposal.find(
          (proposal) => proposal.page?.type === 'proposal_template'
        )?.page?.id;
        if (proposalTemplateId) {
          if (!proposalTemplateIdFormFieldIdsRecord[proposalTemplateId]) {
            proposalTemplateIdFormFieldIdsRecord[proposalTemplateId] = [];
          }
          proposalTemplateIdFormFieldIdsRecord[proposalTemplateId].push(formField.id);
        }
      });

      Object.entries(proposalTemplateIdFormFieldIdsRecord).forEach(([templateId, formFieldIds]) => {
        boardSelectedProperties.templateProperties.push({
          formFields: formFieldIds,
          rubricEvaluations: [],
          templateId
        });
      });

      const uniqueRubricTitles = Array.from(
        new Set(
          cardProperties
            .filter((cardProperty) => !!cardProperty.evaluationTitle)
            .map((property) => property.evaluationTitle)
            .filter(isTruthy)
        )
      );

      const rubricEvaluations = await prisma.proposalEvaluation.findMany({
        where: {
          title: {
            in: uniqueRubricTitles
          },
          proposal: {
            spaceId: proposalSourceBoard.spaceId,
            page: {
              type: 'proposal_template'
            }
          }
        },
        select: {
          id: true,
          title: true,
          proposal: {
            select: {
              page: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      });

      const evaluationTitleProposalTemplateIdsRecord: Record<string, string[]> = {};

      rubricEvaluations.forEach((evaluation) => {
        const proposalTemplateId = evaluation.proposal.page?.id;
        if (proposalTemplateId) {
          if (!evaluationTitleProposalTemplateIdsRecord[evaluation.title]) {
            evaluationTitleProposalTemplateIdsRecord[evaluation.title] = [];
          }

          evaluationTitleProposalTemplateIdsRecord[evaluation.title].push(proposalTemplateId);
        }
      });

      cardProperties.forEach((property) => {
        if (
          (property.type === 'proposalEvaluatedBy' ||
            property.type === 'proposalEvaluationTotal' ||
            property.type === 'proposalEvaluationAverage' ||
            property.type === 'proposalRubricCriteriaTotal' ||
            property.type === 'proposalRubricCriteriaAverage' ||
            property.type === 'proposalRubricCriteriaReviewerScore' ||
            property.type === 'proposalRubricCriteriaReviewerComment') &&
          property.evaluationTitle
        ) {
          const evaluationTitle = property.evaluationTitle;
          const proposalTemplateIds = evaluationTitleProposalTemplateIdsRecord[evaluationTitle];
          proposalTemplateIds.forEach((proposalTemplateId) => {
            const proposalTemplateProperty = boardSelectedProperties.templateProperties.find(
              (templateProperty) => templateProperty.templateId === proposalTemplateId
            );
            const rubricEvaluation = rubricEvaluations.find(
              (evaluation) =>
                evaluation.title === evaluationTitle && evaluation.proposal.page?.id === proposalTemplateId
            );
            if (rubricEvaluation) {
              if (!proposalTemplateProperty) {
                boardSelectedProperties.templateProperties.push({
                  formFields: [],
                  rubricEvaluations: [
                    {
                      evaluationId: rubricEvaluation.id,
                      properties: [ProposalPropertyRubricPropertyRecord[property.type]],
                      title: evaluationTitle
                    }
                  ],
                  templateId: proposalTemplateId
                });
              } else {
                const rubricEvaluationProperty = ProposalPropertyRubricPropertyRecord[property.type];
                const propertyRubricEvaluation = proposalTemplateProperty.rubricEvaluations.find(
                  (evaluation) => evaluation.evaluationId === rubricEvaluation.id
                );
                if (propertyRubricEvaluation) {
                  if (!propertyRubricEvaluation.properties.includes(rubricEvaluationProperty)) {
                    propertyRubricEvaluation.properties.push(rubricEvaluationProperty);
                  }
                } else {
                  proposalTemplateProperty.rubricEvaluations.push({
                    evaluationId: rubricEvaluation.id,
                    properties: [rubricEvaluationProperty],
                    title: evaluationTitle
                  });
                }
              }
            }
          });
        }
      });

      await updateBoardProperties({
        boardId: proposalSourceBoard.id,
        selectedProperties: boardSelectedProperties
      });
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

updateProposalSourceDatabaseBoardProperties().then(() => console.log('Done'));
