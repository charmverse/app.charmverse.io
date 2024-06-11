import type { SelectedProposalProperties } from 'components/common/DatabaseEditor/components/viewSidebar/viewSourceOptions/components/ProposalSourceProperties/ProposalSourcePropertiesDialog';
import { projectFieldProperties, projectMemberFieldProperties } from 'lib/projects/formField';

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
    if (p.formFieldId && selectedFormFields.includes(p.formFieldId)) {
      return true;
    }

    const matchedProjectFieldProperty = projectFieldProperties.find((field) => field.columnPropertyId === p.id);

    if (matchedProjectFieldProperty && selectedProjectProperties.includes(matchedProjectFieldProperty.field)) {
      return true;
    }

    const matchedProjectMemberFieldProperty = projectMemberFieldProperties.find(
      (field) => field.columnPropertyId === p.id
    );

    if (
      matchedProjectMemberFieldProperty &&
      selectedProjectMemberProperties.includes(matchedProjectMemberFieldProperty.field)
    ) {
      return true;
    }

    if (proposalCustomPropertyIds.includes(p.id) && selectedCustomProperties.includes(p.id)) {
      return true;
    }

    const isDefaultProposalProperty = defaultProposalPropertyTypes.includes(p.type);

    if (
      isDefaultProposalProperty &&
      selectedProperties.defaults.includes(p.type as SelectedProposalProperties['defaults'][number])
    ) {
      return true;
    }

    if (
      p.type === 'proposalEvaluationAverage' ||
      p.type === 'proposalEvaluationTotal' ||
      p.type === 'proposalEvaluatedBy' ||
      p.type === 'proposalRubricCriteriaTotal' ||
      p.type === 'proposalRubricCriteriaAverage'
    ) {
      const rubricEvaluation = selectedProperties.rubricEvaluations.find((r) => r.title === p.evaluationTitle);
      if (!rubricEvaluation) {
        return false;
      }
      if (rubricEvaluation.average && p.type === 'proposalEvaluationAverage') {
        return true;
      }

      if (rubricEvaluation.total && p.type === 'proposalEvaluationTotal') {
        return true;
      }

      if (rubricEvaluation.reviewers && p.type === 'proposalEvaluatedBy') {
        return true;
      }

      if (rubricEvaluation.criteriaTotal && p.type === 'proposalRubricCriteriaTotal') {
        return true;
      }

      if (rubricEvaluation.criteriaAverage && p.type === 'proposalRubricCriteriaAverage') {
        return true;
      }
    }

    return false;
  });
}
