import { projectFieldProperties, projectMemberFieldProperties } from '@packages/lib/projects/formField';

import type { SelectedProposalProperties } from 'components/common/DatabaseEditor/components/viewSidebar/viewSourceOptions/components/ProposalSourceProperties/interfaces';

import type { IPropertyTemplate } from '../board';
import { defaultProposalPropertyTypes } from '../proposalDbProperties';

import type { EvaluationStep } from './getBoardProperties';

export function filterBoardProperties({
  boardProperties,
  selectedProperties,
  evaluationSteps,
  proposalCustomProperties
}: {
  boardProperties: IPropertyTemplate[];
  selectedProperties: SelectedProposalProperties;
  proposalCustomProperties: IPropertyTemplate[];
  evaluationSteps: EvaluationStep[];
}) {
  const selectedFormFieldIds = selectedProperties.templateProperties.map((p) => p.formFields).flat();
  const selectedProjectProperties = selectedProperties.project;
  const selectedProjectMemberProperties = selectedProperties.projectMember;
  const selectedCustomProperties = selectedProperties.customProperties;
  const proposalCustomPropertyIds = proposalCustomProperties.map((p) => p.id);

  return boardProperties.filter((p) => {
    // This column is always necessary to find the value/label for the proposal status column
    if (p.type === 'proposalEvaluationType') {
      return true;
    }

    if (p.formFieldId) {
      return selectedFormFieldIds.includes(p.formFieldId);
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
      p.type === 'proposalEvaluationReviewerAverage' ||
      p.type === 'proposalEvaluationTotal' ||
      p.type === 'proposalEvaluatedBy' ||
      p.type === 'proposalRubricCriteriaTotal' ||
      p.type === 'proposalRubricCriteriaAverage' ||
      p.type === 'proposalRubricCriteriaReviewerScore' ||
      p.type === 'proposalRubricCriteriaReviewerComment'
    ) {
      const templateProperty = selectedProperties.templateProperties.find((t) => t.templateId === p.templateId);
      const evaluationStep = evaluationSteps?.find(
        (e) => e.proposal?.page?.id === p.templateId && e.title === p.evaluationTitle
      );
      const rubricEvaluation = templateProperty?.rubricEvaluations.find((e) => e.title === p.evaluationTitle);
      if (!rubricEvaluation || !templateProperty || !evaluationStep) {
        return false;
      }
      if (p.type === 'proposalEvaluationAverage') {
        return rubricEvaluation.properties.includes('average');
      }

      if (p.type === 'proposalEvaluationReviewerAverage') {
        return rubricEvaluation.properties.includes('reviewerAverage');
      }

      if (p.type === 'proposalEvaluationTotal') {
        return rubricEvaluation.properties.includes('total');
      }

      if (p.type === 'proposalEvaluatedBy') {
        return rubricEvaluation.properties.includes('reviewers');
      }

      const isRubricEvaluationCriteriaPresent = evaluationStep.rubricCriteria.find((c) => c.title === p.criteriaTitle);

      if (!isRubricEvaluationCriteriaPresent) {
        return false;
      }

      if (p.type === 'proposalRubricCriteriaTotal') {
        return rubricEvaluation.properties.includes('criteriaTotal');
      }

      if (p.type === 'proposalRubricCriteriaAverage') {
        return rubricEvaluation.properties.includes('criteriaAverage');
      }

      if (p.type === 'proposalRubricCriteriaReviewerScore') {
        return rubricEvaluation.properties.includes('reviewerScore');
      }

      if (p.type === 'proposalRubricCriteriaReviewerComment') {
        return rubricEvaluation.properties.includes('reviewerComment');
      }
    }
    // Custom proposal source board properties, so always show them
    return true;
  });
}
