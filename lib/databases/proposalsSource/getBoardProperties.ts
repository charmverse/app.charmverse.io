import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import type { SelectedProposalProperties } from 'components/common/DatabaseEditor/components/viewSidebar/viewSourceOptions/components/ProposalSourceProperties/ProposalSourcePropertiesDialog';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { IPropertyTemplate } from 'lib/databases/board';
import { defaultProposalPropertyTypes, proposalDbProperties } from 'lib/databases/proposalDbProperties';
import type { FormFieldInput } from 'lib/forms/interfaces';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/formField';
import { getFieldConfig, projectFieldProperties, projectMemberFieldProperties } from 'lib/projects/formField';
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
    description?: string | null;
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
  selectedProperties: SelectedProposalProperties;
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

  let boardProperties = [...currentCardProperties];

  // standard proposal properties
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalReviewerNotes());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalAuthor());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalStatus());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalUrl());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalEvaluationType());
  applyToPropertiesByType(boardProperties, {
    ...proposalDbProperties.proposalReviewer(),
    name: 'Proposal Reviewers'
  });
  applyToPropertiesByType(
    boardProperties,
    proposalDbProperties.proposalStep({
      options: ['Draft', ...Array.from(evaluationStepTitles), 'Rewards', 'Credentials']
    })
  );

  // properties per each evaluation step
  applyProposalEvaluationProperties(boardProperties, Array.from(rubricStepTitles));

  // custom properties from the original proposals container
  proposalCustomProperties.forEach((cardProp) => {
    applyToPropertiesById(boardProperties, cardProp);
  });

  // properties related to form proposals
  applyFormFieldProperties(boardProperties, formFields);

  // properties for each unique questions on rubric evaluation step
  applyRubricEvaluationQuestionProperties(boardProperties, evaluationSteps);

  const selectedFormFields = selectedProperties.formFields;
  const selectedProjectProperties = selectedProperties.project;
  const selectedProjectMemberProperties = selectedProperties.projectMember;
  const selectedCustomProperties = selectedProperties.customProperties;
  const proposalCustomPropertyIds = proposalCustomProperties.map((p) => p.id);

  boardProperties = boardProperties.filter((p) => {
    if (p.formFieldId && !selectedFormFields.includes(p.formFieldId)) {
      return false;
    }

    const matchedProjectFieldProperty = projectFieldProperties.find((field) => field.columnPropertyId === p.id);

    if (matchedProjectFieldProperty && !selectedProjectProperties.includes(matchedProjectFieldProperty.field)) {
      return false;
    }

    const matchedProjectMemberFieldProperty = projectMemberFieldProperties.find(
      (field) => field.columnPropertyId === p.id
    );

    if (
      matchedProjectMemberFieldProperty &&
      !selectedProjectMemberProperties.includes(matchedProjectMemberFieldProperty.field)
    ) {
      return false;
    }

    if (proposalCustomPropertyIds.includes(p.id) && !selectedCustomProperties.includes(p.id)) {
      return false;
    }

    const isDefaultProposalProperty = defaultProposalPropertyTypes.includes(p.type);

    if (isDefaultProposalProperty && !selectedProperties.defaults.includes(p.type)) {
      return false;
    }

    if (
      p.type === 'proposalEvaluationAverage' ||
      p.type === 'proposalEvaluationTotal' ||
      p.type === 'proposalEvaluatedBy'
    ) {
      const rubricEvaluation = selectedProperties.rubricEvaluations.find((r) => r.title === p.name);
      if ((!rubricEvaluation || !rubricEvaluation.average) && p.type === 'proposalEvaluationAverage') {
        return false;
      }

      if ((!rubricEvaluation || !rubricEvaluation.total) && p.type === 'proposalEvaluationTotal') {
        return false;
      }

      if ((!rubricEvaluation || !rubricEvaluation.reviewers) && p.type === 'proposalEvaluatedBy') {
        return false;
      }
    } else if (p.type === 'proposalRubricCriteriaTotal') {
      const rubricEvaluation = selectedProperties.rubricEvaluations.find((r) => r.title === p.evaluationTitle);
      if (!rubricEvaluation || !rubricEvaluation.criteriaTotal) {
        return false;
      }
    }

    return true;
  });

  return boardProperties;
}

function applyRubricEvaluationQuestionProperties(
  boardProperties: IPropertyTemplate[],
  evaluationSteps: EvaluationStep[]
) {
  const rubricCriteriaEvaluationTitlesRecord: Record<
    string,
    {
      evaluationTitle: string;
      rubricCriteriaDescription: string;
    }
  > = {};
  evaluationSteps.forEach((evaluationStep) => {
    if (evaluationStep.type === 'rubric') {
      evaluationStep.rubricCriteria.forEach((rubricCriteria) => {
        if (!rubricCriteriaEvaluationTitlesRecord[rubricCriteria.title]) {
          rubricCriteriaEvaluationTitlesRecord[rubricCriteria.title] = {
            evaluationTitle: evaluationStep.title,
            rubricCriteriaDescription: rubricCriteria.description || ''
          };
        }
      });
    }
  });

  Object.entries(rubricCriteriaEvaluationTitlesRecord).forEach(
    ([rubricCriteriaTitle, { evaluationTitle, rubricCriteriaDescription }]) => {
      applyToPropertiesByTypeAndName(boardProperties, {
        id: uuid(),
        type: 'proposalRubricCriteriaTotal',
        name: rubricCriteriaTitle,
        tooltip: rubricCriteriaDescription,
        readOnly: true,
        readOnlyValues: true,
        evaluationTitle,
        private: false
      });
    }
  );
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
    if (getFieldConfig(fieldConfig[field.field]).show) {
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
