import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import type { SelectedProposalProperties } from 'components/common/DatabaseEditor/components/viewSidebar/viewSourceOptions/components/ProposalSourceProperties/ProposalSourcePropertiesDialog';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { IPropertyTemplate } from 'lib/databases/board';
import { proposalDbProperties } from 'lib/databases/proposalDbProperties';
import type { FormFieldInput } from 'lib/forms/interfaces';
import { projectFieldProperties, projectMemberFieldProperties } from 'lib/projects/formField';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { filterBoardProperties } from './filterBoardProperties';

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
    answers: {
      user: {
        id: string;
        username: string;
      };
    }[];
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
  selectedProperties?: SelectedProposalProperties;
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

  // properties related to project profile
  applyProjectProfileProperties(boardProperties);

  applyRubricEvaluationReviewerProperties(boardProperties, evaluationSteps);

  boardProperties.forEach((property) => {
    property.name = getPropertyName(property);
  });

  if (!selectedProperties) {
    return boardProperties;
  }

  return filterBoardProperties({
    boardProperties,
    proposalCustomProperties,
    selectedProperties
  });
}

function applyRubricEvaluationReviewerProperties(
  boardProperties: IPropertyTemplate[],
  evaluationSteps: EvaluationStep[]
) {
  evaluationSteps.forEach((evaluationStep) => {
    if (evaluationStep.type === 'rubric') {
      evaluationStep.rubricCriteria.forEach((rubricCriteria) => {
        rubricCriteria.answers.forEach((answer) => {
          const existingCriteriaReviewerScorePropIndex = boardProperties.findIndex(
            (p) =>
              p.type === 'proposalRubricCriteriaReviewerScore' &&
              p.evaluationTitle === evaluationStep.title &&
              p.criteriaTitle === rubricCriteria.title &&
              p.reviewerId === answer.user.id
          );
          if (existingCriteriaReviewerScorePropIndex === -1) {
            boardProperties.push({
              id: uuid(),
              type: 'proposalRubricCriteriaReviewerScore',
              name: `${evaluationStep.title} - ${rubricCriteria.title} - ${answer.user.username} - Score`,
              evaluationTitle: evaluationStep.title,
              criteriaTitle: rubricCriteria.title,
              reviewerId: answer.user.id,
              private: false,
              options: []
            });
          }

          const existingCriteriaReviewerCommentPropIndex = boardProperties.findIndex(
            (p) =>
              p.type === 'proposalRubricCriteriaReviewerComment' &&
              p.evaluationTitle === evaluationStep.title &&
              p.criteriaTitle === rubricCriteria.title &&
              p.reviewerId === answer.user.id
          );
          if (existingCriteriaReviewerCommentPropIndex === -1) {
            boardProperties.push({
              id: uuid(),
              type: 'proposalRubricCriteriaReviewerComment',
              name: `${evaluationStep.title} - ${rubricCriteria.title} - ${answer.user.username} - Comment`,
              evaluationTitle: evaluationStep.title,
              criteriaTitle: rubricCriteria.title,
              reviewerId: answer.user.id,
              private: false,
              options: []
            });
          }
        });
      });
    }
  });
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
        name: `${evaluationTitle}: ${rubricCriteriaTitle}`,
        tooltip: rubricCriteriaDescription,
        readOnly: true,
        readOnlyValues: true,
        evaluationTitle,
        criteriaTitle: rubricCriteriaTitle,
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
function applyProjectProfileProperties(boardProperties: IPropertyTemplate[]) {
  projectFieldProperties.forEach((field) => {
    applyToPropertiesById(boardProperties, {
      id: field.columnPropertyId,
      name: field.columnTitle,
      type: 'text'
    });
  });
  projectMemberFieldProperties.forEach((field) => {
    applyToPropertiesById(boardProperties, {
      id: field.columnPropertyId,
      name: field.columnTitle,
      type: 'multiSelect',
      dynamicOptions: true
    });
  });
}

function applyProposalEvaluationProperties(boardProperties: IPropertyTemplate[], rubricStepTitles: string[]) {
  for (const rubricStepTitle of rubricStepTitles) {
    applyToPropertiesByTypeAndName(boardProperties, {
      id: uuid(),
      type: 'proposalEvaluatedBy',
      name: rubricStepTitle,
      evaluationTitle: rubricStepTitle
    });

    applyToPropertiesByTypeAndName(boardProperties, {
      id: uuid(),
      type: 'proposalEvaluationTotal',
      name: rubricStepTitle,
      evaluationTitle: rubricStepTitle
    });

    applyToPropertiesByTypeAndName(boardProperties, {
      id: uuid(),
      type: 'proposalEvaluationAverage',
      name: rubricStepTitle,
      evaluationTitle: rubricStepTitle
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
    (p) =>
      p.type === fieldProperty.type &&
      p.evaluationTitle === fieldProperty.evaluationTitle &&
      p.criteriaTitle === fieldProperty.criteriaTitle
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

function getPropertyName(property: IPropertyTemplate) {
  return property.type === 'proposalEvaluatedBy'
    ? `${property.name} (Step reviewers)`
    : property.type === 'proposalEvaluationAverage'
    ? `${property.name} (Step average)`
    : property.type === 'proposalEvaluationTotal'
    ? `${property.name} (Step total)`
    : property.type === 'proposalRubricCriteriaTotal'
    ? `${property.name} (Criterial total)`
    : property.name;
}
