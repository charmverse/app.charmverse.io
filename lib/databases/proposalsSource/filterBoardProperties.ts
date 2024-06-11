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
      p.type === 'proposalRubricCriteriaTotal'
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
    }
    // Custom proposal source board properties, so always show them
    return true;
  });
}
