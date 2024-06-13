import type { SelectedProposalProperties } from 'components/common/DatabaseEditor/components/viewSidebar/viewSourceOptions/components/ProposalSourceProperties/ProposalSourcePropertiesDialog';
import { projectFieldProperties, projectMemberFieldProperties } from 'lib/projects/formField';
import { prettyPrint } from 'lib/utils/strings';

import type { IPropertyTemplate } from '../board';
import { defaultProposalPropertyTypes } from '../proposalDbProperties';

export function filterBoardProperties({
  boardProperties,
  selectedProperties,
  proposalCustomProperties
}: {
  boardProperties: IPropertyTemplate[];
  selectedProperties: SelectedProposalProperties;
  proposalCustomProperties: IPropertyTemplate[];
}) {
  const selectedFormFields = selectedProperties.formFields;
  const selectedProjectProperties = selectedProperties.project;
  const selectedProjectMemberProperties = selectedProperties.projectMember;
  const selectedCustomProperties = selectedProperties.customProperties;
  const proposalCustomPropertyIds = proposalCustomProperties.map((p) => p.id);

  return boardProperties.filter((p) => {
    if (p.formFieldId) {
      return selectedFormFields.includes(p.formFieldId);
    }

    const matchedProjectFieldProperty = projectFieldProperties.find((field) => field.columnPropertyId === p.id);

    if (matchedProjectFieldProperty) {
      return selectedProjectProperties.includes(matchedProjectFieldProperty.field);
    }

    const matchedProjectMemberFieldProperty = projectMemberFieldProperties.find(
      (field) => field.columnPropertyId === p.id
    );

    if (matchedProjectMemberFieldProperty) {
      return selectedProjectMemberProperties.includes(matchedProjectMemberFieldProperty.field);
    }

    if (proposalCustomPropertyIds.includes(p.id)) {
      return selectedCustomProperties.includes(p.id);
    }

    const isDefaultProposalProperty = defaultProposalPropertyTypes.includes(p.type);

    if (isDefaultProposalProperty) {
      return selectedProperties.defaults.includes(p.type as SelectedProposalProperties['defaults'][number]);
    }

    if (
      p.type === 'proposalEvaluationAverage' ||
      p.type === 'proposalEvaluationTotal' ||
      p.type === 'proposalEvaluatedBy' ||
      p.type === 'proposalRubricCriteriaTotal' ||
      p.type === 'proposalRubricCriteriaReviewerComment' ||
      p.type === 'proposalRubricCriteriaReviewerScore' ||
      p.type === 'proposalRubricCriteriaAverage'
    ) {
      const rubricEvaluation = selectedProperties.rubricEvaluations.find((r) => r.title === p.evaluationTitle);
      if (!rubricEvaluation) {
        return false;
      }
      if (p.type === 'proposalEvaluationAverage') {
        return !!rubricEvaluation.average;
      }

      if (p.type === 'proposalEvaluationTotal') {
        return !!rubricEvaluation.total;
      }

      if (p.type === 'proposalEvaluatedBy') {
        return !!rubricEvaluation.reviewers;
      }

      if (p.type === 'proposalRubricCriteriaTotal') {
        return !!rubricEvaluation.criteriaTotal;
      }

      if (p.type === 'proposalRubricCriteriaReviewerComment') {
        return !!rubricEvaluation.reviewerComment;
      }

      if (p.type === 'proposalRubricCriteriaReviewerScore') {
        return !!rubricEvaluation.reviewerScore;
      }

      if (p.type === 'proposalRubricCriteriaAverage') {
        return !!rubricEvaluation.criteriaAverage;
      }
    }
    // Custom proposal source board properties, so always show them
    return true;
  });
}
