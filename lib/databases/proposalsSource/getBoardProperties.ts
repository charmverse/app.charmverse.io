import { v4 as uuid } from 'uuid';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { FormFieldInput } from 'components/common/form/interfaces';
import type { IPropertyTemplate } from 'lib/databases/board';
import { proposalDbProperties } from 'lib/databases/proposalDbProperties';
import { getFieldConfig, projectFieldProperties, projectMemberFieldProperties } from 'lib/projects/formField';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/formField';
import type { PageContent } from 'lib/prosemirror/interfaces';

// Note: maybe we should instead hav ea whitelist of form field answers that we support?
export const excludedFieldTypes = ['project_profile', 'label'];

// define properties that will apply to all source fields
const defaultOptions = { readOnly: true, readOnlyValues: true, options: [], dynamicOptions: true };

// apply proposal-related properties to the board
export function getBoardProperties({
  currentCardProperties = [],
  formFields = [],
  evaluationStepTitles = [],
  proposalCustomProperties = [],
  rubricStepTitles = []
}: {
  rubricStepTitles?: string[];
  proposalCustomProperties?: IPropertyTemplate[];
  evaluationStepTitles?: string[];
  currentCardProperties?: IPropertyTemplate[];
  formFields?: FormFieldInput[];
}) {
  const boardProperties = [...currentCardProperties];

  // standard proposal properties
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalReviewerNotes());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalAuthor());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalStatus());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalUrl());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalEvaluationType());
  applyToPropertiesByType(
    boardProperties,
    proposalDbProperties.proposalStep({ options: ['Draft', ...evaluationStepTitles, 'Rewards', 'Credentials'] })
  );

  // properties per each evaluation step
  applyProposalEvaluationProperties(boardProperties, rubricStepTitles);

  // custom properties from the original proposals container
  proposalCustomProperties.forEach((cardProp) => {
    applyToPropertiesById(boardProperties, {
      ...cardProp,
      proposalFieldId: cardProp.id
    });
  });

  // properties related to form proposals
  applyFormFieldProperties(boardProperties, formFields);

  return boardProperties;
}

function applyFormFieldProperties(boardProperties: IPropertyTemplate[], formFields: FormFieldInput[]) {
  formFields.forEach((formField) => {
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
        applyProjectProfileProperties(boardProperties, formField.fieldConfig as ProjectAndMembersFieldConfig);
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
  fieldConfig: ProjectAndMembersFieldConfig
) {
  projectFieldProperties.forEach((field) => {
    const config = getFieldConfig(fieldConfig[field.field]);
    if (config.show) {
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
    if (config.show) {
      applyToPropertiesById(boardProperties, {
        id: field.columnPropertyId,
        name: field.columnTitle,
        private: config.private,
        type: 'multiSelect'
      });
    }
  });
}

function applyProposalEvaluationProperties(boardProperties: IPropertyTemplate[], rubricStepTitles: string[]) {
  for (const rubricStepTitle of rubricStepTitles) {
    applyToPropertiesByTypeAndName(boardProperties, {
      id: uuid(),
      type: 'proposalEvaluatedBy',
      name: rubricStepTitle
    });
    applyToPropertiesByTypeAndName(boardProperties, {
      id: uuid(),
      type: 'proposalEvaluationTotal',
      name: rubricStepTitle
    });
    applyToPropertiesByTypeAndName(boardProperties, {
      id: uuid(),
      type: 'proposalEvaluationAverage',
      name: rubricStepTitle
    });
  }
}

type PartialPropertyTemplate = Omit<IPropertyTemplate, 'options'>;

function applyToPropertiesById(boardProperties: IPropertyTemplate[], fieldProperty: PartialPropertyTemplate) {
  const existingProp = boardProperties.find((p) => p.id === fieldProperty.id);
  if (!existingProp) {
    boardProperties.push({
      ...defaultOptions,
      ...fieldProperty
    });
  } else {
    Object.assign(existingProp, defaultOptions, fieldProperty);
  }
}

function applyToPropertiesByType(
  boardProperties: IPropertyTemplate[],
  { id, ...fieldProperty }: PartialPropertyTemplate
) {
  const existingProp = boardProperties.find((p) => p.type === fieldProperty.type);
  if (!existingProp) {
    boardProperties.push({ id, ...defaultOptions, ...fieldProperty });
  } else {
    Object.assign(existingProp, defaultOptions, fieldProperty);
  }
}

function applyToPropertiesByTypeAndName(
  boardProperties: IPropertyTemplate[],
  { id, ...fieldProperty }: PartialPropertyTemplate
) {
  const existingProp = boardProperties.find((p) => p.type === fieldProperty.type && p.name === fieldProperty.name);
  if (!existingProp) {
    boardProperties.push({ id, ...defaultOptions, ...fieldProperty });
  } else {
    Object.assign(existingProp, defaultOptions, fieldProperty);
  }
}

function applyFormFieldToProperties(
  boardProperties: IPropertyTemplate[],
  { id, ...fieldProperty }: PartialPropertyTemplate
) {
  const existingProp = boardProperties.find((p) => p.formFieldId === fieldProperty.formFieldId);
  if (!existingProp) {
    boardProperties.push({
      id,
      ...defaultOptions,
      ...fieldProperty
    });
  } else {
    Object.assign(existingProp, defaultOptions, fieldProperty);
  }
}

export function getPropertyName(property: IPropertyTemplate) {
  return property.type === 'proposalEvaluatedBy'
    ? `${property.name} (Evaluation reviewers)`
    : property.type === 'proposalEvaluationAverage'
    ? `${property.name} (Evaluation average)`
    : property.type === 'proposalEvaluationTotal'
    ? `${property.name} (Evaluation total)`
    : undefined;
}
