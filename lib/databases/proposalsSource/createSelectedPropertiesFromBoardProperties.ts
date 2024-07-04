import type { SelectedProposalProperties } from 'components/common/DatabaseEditor/components/viewSidebar/viewSourceOptions/components/ProposalSourceProperties/ProposalSourcePropertiesDialog';
import { projectFieldProperties, projectMemberFieldProperties } from 'lib/projects/formField';
import type { ProposalTemplateMeta } from 'lib/proposals/getProposalTemplates';
import { isTruthy } from 'lib/utils/types';

import type { Board } from '../board';
import { defaultProposalPropertyTypes } from '../proposalDbProperties';

export function createSelectedPropertiesStateFromBoardProperties({
  cardProperties,
  proposalCustomProperties,
  proposalTemplates
}: {
  proposalCustomProperties: Board['fields']['cardProperties'];
  cardProperties: Board['fields']['cardProperties'];
  proposalTemplates: ProposalTemplateMeta[];
}) {
  const cardPropertyIds = cardProperties.map((field) => field.id);
  const projectProperties = projectFieldProperties
    .filter((property) => cardPropertyIds.includes(property.columnPropertyId))
    .map((property) => property.field);
  const projectMemberProperties = projectMemberFieldProperties
    .filter((property) => cardPropertyIds.includes(property.columnPropertyId))
    .map((property) => property.field);
  const customPropertyIds = proposalCustomProperties.map((field) => field.id);
  const defaultProposalProperties: string[] = [];
  const customProperties: string[] = [];
  const templateProperties: SelectedProposalProperties['templateProperties'] = [];

  cardProperties.forEach((property) => {
    if (
      property.type === 'proposalEvaluationAverage' ||
      property.type === 'proposalEvaluationTotal' ||
      property.type === 'proposalEvaluatedBy' ||
      property.type === 'proposalRubricCriteriaTotal' ||
      property.type === 'proposalRubricCriteriaReviewerComment' ||
      property.type === 'proposalRubricCriteriaReviewerScore' ||
      property.type === 'proposalRubricCriteriaAverage'
    ) {
      const propertyKey = property.evaluationTitle;
      const proposalTemplate = proposalTemplates.find((template) => template.pageId === property.templateId);
      if (propertyKey && property.templateId && proposalTemplate) {
        let templateProperty = templateProperties.find((template) => template.templateId === property.templateId);

        if (!templateProperty) {
          templateProperty = {
            formFields: cardProperties
              .filter((field) => field.formFieldId && field.templateId === property.templateId)
              .map((field) => field.formFieldId)
              .filter(isTruthy),
            templateId: property.templateId,
            rubricEvaluations: []
          };
          templateProperties.push(templateProperty);
        }

        let rubricEvaluationProperty = templateProperty.rubricEvaluations.find(
          (evaluation) => evaluation.title === property.evaluationTitle
        );
        const proposalTemplateRubricEvaluation = proposalTemplate.evaluations?.find(
          (evaluation) => evaluation.title === property.evaluationTitle
        );

        if (proposalTemplateRubricEvaluation) {
          if (!rubricEvaluationProperty) {
            rubricEvaluationProperty = {
              title: property.evaluationTitle!,
              evaluationId: proposalTemplateRubricEvaluation.id,
              templateId: property.templateId,
              properties: []
            };
          }

          if (property.type === 'proposalEvaluationAverage') {
            rubricEvaluationProperty.properties.push('average');
          } else if (property.type === 'proposalEvaluationTotal') {
            rubricEvaluationProperty.properties.push('total');
          } else if (property.type === 'proposalEvaluatedBy') {
            rubricEvaluationProperty.properties.push('reviewers');
          } else if (property.type === 'proposalRubricCriteriaTotal') {
            rubricEvaluationProperty.properties.push('criteriaTotal');
          } else if (property.type === 'proposalRubricCriteriaReviewerComment') {
            rubricEvaluationProperty.properties.push('reviewerComment');
          } else if (property.type === 'proposalRubricCriteriaReviewerScore') {
            rubricEvaluationProperty.properties.push('reviewerScore');
          } else if (property.type === 'proposalRubricCriteriaAverage') {
            rubricEvaluationProperty.properties.push('criteriaAverage');
          }
        }
      }
    } else if (customPropertyIds.includes(property.id)) {
      customProperties.push(property.id);
    } else if (defaultProposalPropertyTypes.includes(property.type)) {
      defaultProposalProperties.push(property.type);
    }
  });

  return {
    defaults: defaultProposalProperties,
    customProperties,
    project: projectProperties,
    projectMember: projectMemberProperties,
    templateProperties
  } as SelectedProposalProperties;
}
