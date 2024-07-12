import { projectFieldProperties, projectMemberFieldProperties } from '@root/lib/projects/formField';
import { isTruthy } from '@root/lib/utils/types';

import type { SelectedProposalProperties } from 'components/common/DatabaseEditor/components/viewSidebar/viewSourceOptions/components/ProposalSourceProperties/ProposalSourcePropertiesDialog';

import type { Board } from '../board';
import { defaultProposalPropertyTypes } from '../proposalDbProperties';

export function createSelectedPropertiesStateFromBoardProperties({
  cardProperties,
  proposalCustomProperties
}: {
  proposalCustomProperties: Board['fields']['cardProperties'];
  cardProperties: Board['fields']['cardProperties'];
}) {
  const propertyIds = cardProperties.map((field) => field.id);
  const projectProperties = projectFieldProperties
    .filter((property) => propertyIds.includes(property.columnPropertyId))
    .map((property) => property.field);
  const projectMemberProperties = projectMemberFieldProperties
    .filter((property) => propertyIds.includes(property.columnPropertyId))
    .map((property) => property.field);
  const formFieldIds = cardProperties.map((field) => field.formFieldId).filter(isTruthy);
  const rubricEvaluationsPropertiesRecord: Record<string, SelectedProposalProperties['rubricEvaluations'][number]> = {};
  const customPropertyIds = proposalCustomProperties.map((field) => field.id);
  const defaultProposalProperties: string[] = [];
  const customProperties: string[] = [];
  cardProperties.forEach((field) => {
    if (
      field.type === 'proposalEvaluationAverage' ||
      field.type === 'proposalEvaluationReviewerAverage' ||
      field.type === 'proposalEvaluationTotal' ||
      field.type === 'proposalEvaluatedBy' ||
      field.type === 'proposalRubricCriteriaTotal' ||
      field.type === 'proposalRubricCriteriaReviewerComment' ||
      field.type === 'proposalRubricCriteriaReviewerScore' ||
      field.type === 'proposalRubricCriteriaAverage'
    ) {
      const fieldKey = field.evaluationTitle;
      if (fieldKey) {
        if (!rubricEvaluationsPropertiesRecord[fieldKey]) {
          rubricEvaluationsPropertiesRecord[fieldKey] = {
            title: fieldKey
          };
        }

        if (field.type === 'proposalEvaluationAverage') {
          rubricEvaluationsPropertiesRecord[fieldKey].average = true;
        } else if (field.type === 'proposalEvaluationTotal') {
          rubricEvaluationsPropertiesRecord[fieldKey].total = true;
        } else if (field.type === 'proposalEvaluatedBy') {
          rubricEvaluationsPropertiesRecord[fieldKey].reviewers = true;
        } else if (field.type === 'proposalRubricCriteriaTotal') {
          rubricEvaluationsPropertiesRecord[fieldKey].criteriaTotal = true;
        } else if (field.type === 'proposalRubricCriteriaReviewerComment') {
          rubricEvaluationsPropertiesRecord[fieldKey].reviewerComment = true;
        } else if (field.type === 'proposalRubricCriteriaReviewerScore') {
          rubricEvaluationsPropertiesRecord[fieldKey].reviewerScore = true;
        } else if (field.type === 'proposalRubricCriteriaAverage') {
          rubricEvaluationsPropertiesRecord[fieldKey].criteriaAverage = true;
        } else if (field.type === 'proposalEvaluationReviewerAverage') {
          rubricEvaluationsPropertiesRecord[fieldKey].reviewerAverage = true;
        }
      }
    } else if (customPropertyIds.includes(field.id)) {
      customProperties.push(field.id);
    } else if (defaultProposalPropertyTypes.includes(field.type)) {
      defaultProposalProperties.push(field.type);
    }
  });

  return {
    defaults: defaultProposalProperties,
    customProperties,
    project: projectProperties,
    projectMember: projectMemberProperties,
    formFields: formFieldIds,
    rubricEvaluations: Object.values(rubricEvaluationsPropertiesRecord)
  } as SelectedProposalProperties;
}
