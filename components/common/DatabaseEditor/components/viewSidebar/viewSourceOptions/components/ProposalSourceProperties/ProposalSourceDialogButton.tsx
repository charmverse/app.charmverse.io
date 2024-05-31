import { usePopupState } from 'material-ui-popup-state/hooks';
import { useMemo } from 'react';

import { Button } from 'components/common/Button';
import type { Board } from 'lib/databases/board';
import { projectFieldProperties, projectMemberFieldProperties } from 'lib/projects/formField';
import { isTruthy } from 'lib/utils/types';

import { ProposalSourcePropertiesDialog, type SelectedProperties } from './ProposalSourcePropertiesDialog';

export function ProposalSourceDialogButton({ board }: { board: Board }) {
  const proposalSourcePropertiesPopupState = usePopupState({
    variant: 'dialog'
  });
  const proposalSourceSelectedProperties = useMemo(() => {
    const propertyIds = board.fields.cardProperties.map((field) => field.id);
    const projectProperties = projectFieldProperties
      .filter((property) => propertyIds.includes(property.columnPropertyId))
      .map((property) => property.field);
    const projectMemberProperties = projectMemberFieldProperties
      .filter((property) => propertyIds.includes(property.columnPropertyId))
      .map((property) => property.field);
    const formFieldIds = board.fields.cardProperties.map((field) => field.formFieldId).filter(isTruthy);
    const rubricEvaluationsPropertiesRecord: Record<string, SelectedProperties['rubricEvaluations'][number]> = {};
    board.fields.cardProperties.forEach((field) => {
      if (
        field.type === 'proposalEvaluationAverage' ||
        field.type === 'proposalEvaluationTotal' ||
        field.type === 'proposalEvaluatedBy' ||
        field.type === 'proposalRubricCriteriaTotal'
      ) {
        const fieldKey = field.evaluationTitle || field.name;
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
        }
      }
    });

    return {
      customProperties: [],
      project: projectProperties,
      projectMember: projectMemberProperties,
      formFields: formFieldIds,
      rubricEvaluations: Object.values(rubricEvaluationsPropertiesRecord)
    } as SelectedProperties;
  }, [board.fields.cardProperties]);

  return (
    <>
      <Button
        variant='outlined'
        color='secondary'
        onClick={proposalSourcePropertiesPopupState.open}
        sx={{
          m: 2
        }}
      >
        Edit properties
      </Button>
      {proposalSourcePropertiesPopupState.isOpen && (
        <ProposalSourcePropertiesDialog
          onClose={proposalSourcePropertiesPopupState.close}
          onApply={(selectedProperties) => {}}
          initialSelectedProperties={proposalSourceSelectedProperties}
        />
      )}
    </>
  );
}
