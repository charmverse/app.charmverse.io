import { projectFieldProperties, projectMemberFieldProperties } from '@root/lib/projects/formField';

import type { SelectedProposalProperties } from 'components/common/DatabaseEditor/components/viewSidebar/viewSourceOptions/components/ProposalSourceProperties/interfaces';
import type { ProposalTemplateMeta } from 'lib/proposals/getProposalTemplates';

import type { Board } from '../board';
import { defaultProposalPropertyTypes } from '../proposalDbProperties';

export function createSelectedPropertiesStateFromBoardProperties({
  cardProperties,
  proposalCustomProperties,
  proposalTemplates
}: {
  proposalCustomProperties: Board['fields']['cardProperties'];
  cardProperties: Board['fields']['cardProperties'];
  proposalTemplates: Pick<ProposalTemplateMeta, 'pageId' | 'evaluations'>[];
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
    const proposalTemplate = proposalTemplates.find((template) => template.pageId === property.templateId);
    let templateProperty = templateProperties.find((template) => template.templateId === property.templateId);

    if (!templateProperty && property.templateId) {
      templateProperty = {
        formFields: [],
        templateId: property.templateId,
        rubricEvaluations: []
      };
      templateProperties.push(templateProperty);
    }

    if (
      property.type === 'proposalEvaluatedBy' ||
      property.type === 'proposalEvaluationTotal' ||
      property.type === 'proposalEvaluationAverage' ||
      property.type === 'proposalEvaluationReviewerAverage' ||
      property.type === 'proposalRubricCriteriaTotal' ||
      property.type === 'proposalRubricCriteriaAverage' ||
      property.type === 'proposalRubricCriteriaReviewerScore' ||
      property.type === 'proposalRubricCriteriaReviewerComment'
    ) {
      if (proposalTemplate && templateProperty) {
        let rubricEvaluationProperty = templateProperty.rubricEvaluations.find(
          (evaluation) => evaluation.title === property.evaluationTitle
        );
        const proposalTemplateRubricEvaluation = proposalTemplate.evaluations?.find(
          (evaluation) => evaluation.title === property.evaluationTitle && evaluation.type === 'rubric'
        );

        if (proposalTemplateRubricEvaluation) {
          if (!rubricEvaluationProperty) {
            rubricEvaluationProperty = {
              title: property.evaluationTitle!,
              evaluationId: proposalTemplateRubricEvaluation.id,
              properties: []
            };

            templateProperty.rubricEvaluations.push(rubricEvaluationProperty);
          }

          if (property.type === 'proposalEvaluatedBy') {
            rubricEvaluationProperty.properties.push('reviewers');
          } else if (property.type === 'proposalEvaluationTotal') {
            rubricEvaluationProperty.properties.push('total');
          } else if (property.type === 'proposalEvaluationAverage') {
            rubricEvaluationProperty.properties.push('average');
          } else if (property.type === 'proposalRubricCriteriaTotal') {
            rubricEvaluationProperty.properties.push('criteriaTotal');
          } else if (property.type === 'proposalRubricCriteriaAverage') {
            rubricEvaluationProperty.properties.push('criteriaAverage');
          } else if (property.type === 'proposalRubricCriteriaReviewerScore') {
            rubricEvaluationProperty.properties.push('reviewerScore');
          } else if (property.type === 'proposalRubricCriteriaReviewerComment') {
            rubricEvaluationProperty.properties.push('reviewerComment');
          } else if (property.type === 'proposalEvaluationReviewerAverage') {
            rubricEvaluationProperty.properties.push('reviewerAverage');
          }
        }
      }
    } else if (customPropertyIds.includes(property.id)) {
      customProperties.push(property.id);
    } else if (defaultProposalPropertyTypes.includes(property.type)) {
      defaultProposalProperties.push(property.type);
    } else if (property.formFieldId && templateProperty) {
      templateProperty.formFields.push(property.formFieldId);
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
