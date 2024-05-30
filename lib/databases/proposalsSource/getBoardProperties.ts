import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import type { SelectedProperties } from 'components/common/DatabaseEditor/components/viewSidebar/viewSourceOptions/components/ProposalSourceProperties/ProposalSourcePropertiesDialog';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { IPropertyTemplate } from 'lib/databases/board';
import { proposalDbProperties } from 'lib/databases/proposalDbProperties';
import type { FormFieldInput } from 'lib/forms/interfaces';
import { getFieldConfig, projectFieldProperties, projectMemberFieldProperties } from 'lib/projects/formField';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/formField';
import type { PageContent } from 'lib/prosemirror/interfaces';

// Note: maybe we should instead hav ea whitelist of form field answers that we support?
export const excludedFieldTypes = ['project_profile', 'label'];

// define properties that will apply to all source fields
const defaultOptions = { readOnly: true, readOnlyValues: true, options: [] };

type EvaluationStep = {
  title: string;
  type: ProposalEvaluationType;
  rubricCriteria: {
    title: string;
  }[];
};

// apply proposal-related properties to the board
export function getBoardProperties({
  currentCardProperties = [],
  formFields = [],
  evaluationSteps = [],
  proposalCustomProperties = [],
  selectedProperties
}: {
  selectedProperties?: SelectedProperties;
  proposalCustomProperties?: IPropertyTemplate[];
  evaluationSteps?: EvaluationStep[];
  currentCardProperties?: IPropertyTemplate[];
  formFields?: FormFieldInput[];
}) {
  const evaluationStepTitles: Set<string> = new Set();
  const rubricStepTitles: Set<string> = new Set();
  evaluationSteps.forEach((e) => {
    evaluationStepTitles.add(e.title);
    if (e.type === 'rubric') {
      rubricStepTitles.add(e.title);
    }
  });

  const boardProperties = [...currentCardProperties];

  // standard proposal properties
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalReviewerNotes());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalAuthor());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalStatus());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalUrl());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalEvaluationType());
  applyToPropertiesByType(
    boardProperties,
    proposalDbProperties.proposalStep({
      options: ['Draft', ...Array.from(evaluationStepTitles), 'Rewards', 'Credentials']
    })
  );

  // properties per each evaluation step
  applyProposalEvaluationProperties(boardProperties, Array.from(rubricStepTitles), selectedProperties);

  // custom properties from the original proposals container
  proposalCustomProperties.forEach((cardProp) => {
    applyToPropertiesById(boardProperties, cardProp);
  });

  // properties related to form proposals
  applyFormFieldProperties(boardProperties, formFields, selectedProperties);

  // properties for each unique questions on rubric evaluation step
  applyRubricEvaluationQuestionProperties(boardProperties, evaluationSteps, selectedProperties);

  return boardProperties;
}

function applyRubricEvaluationQuestionProperties(
  boardProperties: IPropertyTemplate[],
  evaluationSteps: EvaluationStep[],
  selectedProperties?: SelectedProperties
) {
  const rubricCriteriaTitles: Set<string> = new Set();
  evaluationSteps.forEach((evaluationStep) => {
    if (
      evaluationStep.type === 'rubric' &&
      selectedProperties?.rubricEvaluations.find((rubricEvaluation) => rubricEvaluation.title === evaluationStep.title)
        ?.criteriaTotal
    ) {
      evaluationStep.rubricCriteria.forEach((rubricCriteria) => {
        rubricCriteriaTitles.add(rubricCriteria.title);
      });
    }
  });

  rubricCriteriaTitles.forEach((rubricCriteriaTitle) => {
    applyToPropertiesByTypeAndName(boardProperties, {
      id: uuid(),
      type: 'proposalRubricCriteriaTotal',
      name: rubricCriteriaTitle,
      description: `Total score for ${rubricCriteriaTitle}`,
      readOnly: true,
      readOnlyValues: true,
      private: false
    });
  });
}

function applyFormFieldProperties(
  boardProperties: IPropertyTemplate[],
  formFields: FormFieldInput[],
  selectedProperties?: SelectedProperties
) {
  formFields
    .filter(
      (formField) => formField.type === 'project_profile' || selectedProperties?.formFields.includes(formField.id)
    )
    .forEach((formField) => {
      let boardPropertyType: IPropertyTemplate['type'] | null = null;
      let boardPropertyOptions: IPropertyTemplate['options'] = [];

      switch (formField.type) {
        case 'short_text':
        case 'wallet':
        case 'long_text': {
          boardPropertyType = 'text';
          break;
        }
        case 'multiselect': {
          boardPropertyType = 'multiSelect';
          boardPropertyOptions = ((formField.options ?? []) as SelectOptionType[]).map((option) => ({
            color: option.color,
            id: option.id,
            value: option.name
          }));
          break;
        }
        case 'select': {
          boardPropertyType = 'select';
          boardPropertyOptions = ((formField.options ?? []) as SelectOptionType[]).map((option) => ({
            color: option.color,
            id: option.id,
            value: option.name
          }));
          break;
        }
        case 'project_profile': {
          applyProjectProfileProperties(
            boardProperties,
            formField.fieldConfig as ProjectAndMembersFieldConfig,
            selectedProperties
          );
          break;
        }
        default: {
          if (!excludedFieldTypes.includes(formField.type)) {
            boardPropertyType = formField.type as IPropertyTemplate['type'];
          }
        }
      }
      if (boardPropertyType) {
        const fieldProperty = {
          id: uuid(),
          name: formField.name,
          options: boardPropertyOptions,
          description: (formField.description as { content: PageContent; contentText: string })?.contentText,
          type: boardPropertyType,
          formFieldId: formField.id,
          readOnly: true,
          readOnlyValues: true,
          private: formField.private
        };

        applyFormFieldToProperties(boardProperties, fieldProperty);
      }
    });
}

// field config ref: lib/projects/constants.ts
function applyProjectProfileProperties(
  boardProperties: IPropertyTemplate[],
  fieldConfig: ProjectAndMembersFieldConfig,
  selectedProperties?: SelectedProperties
) {
  projectFieldProperties.forEach((field) => {
    const config = getFieldConfig(fieldConfig[field.field]);
    if (config.show && (selectedProperties?.project.includes(field.field) ?? true)) {
      applyToPropertiesById(boardProperties, {
        id: field.columnPropertyId,
        name: field.columnTitle,
        private: config.private,
        type: 'text'
      });
    }
  });
  projectMemberFieldProperties.forEach((field) => {
    const config = getFieldConfig(fieldConfig[field.field]);
    if (
      getFieldConfig(fieldConfig[field.field]).show &&
      (selectedProperties?.projectMember.includes(field.field) ?? true)
    ) {
      applyToPropertiesById(boardProperties, {
        id: field.columnPropertyId,
        name: field.columnTitle,
        private: config.private,
        type: 'multiSelect',
        dynamicOptions: true
      });
    }
  });
}

function applyProposalEvaluationProperties(
  boardProperties: IPropertyTemplate[],
  rubricStepTitles: string[],
  selectedProperties?: SelectedProperties
) {
  for (const rubricStepTitle of rubricStepTitles) {
    const selectedRubricEvaluation = selectedProperties?.rubricEvaluations.find(
      (rubricEvaluation) => rubricEvaluation.title === rubricStepTitle
    );

    if (selectedRubricEvaluation) {
      if (selectedRubricEvaluation.reviewers) {
        applyToPropertiesByTypeAndName(boardProperties, {
          id: uuid(),
          type: 'proposalEvaluatedBy',
          name: rubricStepTitle
        });
      }

      if (selectedRubricEvaluation.total) {
        applyToPropertiesByTypeAndName(boardProperties, {
          id: uuid(),
          type: 'proposalEvaluationTotal',
          name: rubricStepTitle
        });
      }

      if (selectedRubricEvaluation.average) {
        applyToPropertiesByTypeAndName(boardProperties, {
          id: uuid(),
          type: 'proposalEvaluationAverage',
          name: rubricStepTitle
        });
      }
    }
  }
}

type PartialPropertyTemplate = Omit<IPropertyTemplate, 'options'>;

function applyToPropertiesById(boardProperties: IPropertyTemplate[], fieldProperty: PartialPropertyTemplate) {
  const existingPropIndex = boardProperties.findIndex((p) => p.id === fieldProperty.id);
  if (existingPropIndex === -1) {
    boardProperties.push({
      ...defaultOptions,
      ...fieldProperty
    });
  } else {
    boardProperties[existingPropIndex] = { ...defaultOptions, ...fieldProperty };
  }
}

function applyToPropertiesByType(
  boardProperties: IPropertyTemplate[],
  { id, ...fieldProperty }: PartialPropertyTemplate
) {
  const existingPropIndex = boardProperties.findIndex((p) => p.type === fieldProperty.type);
  if (existingPropIndex === -1) {
    boardProperties.push({ id, ...defaultOptions, ...fieldProperty });
  } else {
    const existingProp = boardProperties[existingPropIndex];
    boardProperties[existingPropIndex] = { id: existingProp.id, ...defaultOptions, ...fieldProperty };
  }
}

function applyToPropertiesByTypeAndName(
  boardProperties: IPropertyTemplate[],
  { id, ...fieldProperty }: PartialPropertyTemplate
) {
  const existingPropIndex = boardProperties.findIndex(
    (p) => p.type === fieldProperty.type && p.name === fieldProperty.name
  );
  if (existingPropIndex === -1) {
    boardProperties.push({ id, ...defaultOptions, ...fieldProperty });
  } else {
    const existingProp = boardProperties[existingPropIndex];
    boardProperties[existingPropIndex] = { id: existingProp.id, ...defaultOptions, ...fieldProperty };
  }
}

function applyFormFieldToProperties(
  boardProperties: IPropertyTemplate[],
  { id, ...fieldProperty }: PartialPropertyTemplate
) {
  const existingPropIndex = boardProperties.findIndex((p) => p.formFieldId === fieldProperty.formFieldId);
  if (existingPropIndex === -1) {
    boardProperties.push({
      id,
      ...defaultOptions,
      ...fieldProperty
    });
  } else {
    const existingProp = boardProperties[existingPropIndex];
    boardProperties[existingPropIndex] = { id: existingProp.id, ...defaultOptions, ...fieldProperty };
  }
}

export function getPropertyName(property: IPropertyTemplate) {
  return property.type === 'proposalEvaluatedBy'
    ? `${property.name} (Evaluation reviewers)`
    : property.type === 'proposalEvaluationAverage'
    ? `${property.name} (Evaluation average)`
    : property.type === 'proposalEvaluationTotal'
    ? `${property.name} (Evaluation total)`
    : property.type === 'proposalRubricCriteriaTotal'
    ? `${property.name} (Total score)`
    : undefined;
}
