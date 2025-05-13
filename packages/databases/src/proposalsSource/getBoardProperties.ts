import type { PageType, ProposalEvaluationType } from '@charmverse/core/prisma-client';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { projectFieldProperties, projectMemberFieldProperties } from '@packages/lib/projects/formField';
import type { FormFieldInput, SelectOptionType } from '@packages/lib/proposals/forms/interfaces';
import { v4 as uuid } from 'uuid';

import type { SelectedProposalProperties } from 'components/common/DatabaseEditor/components/viewSidebar/viewSourceOptions/components/ProposalSourceProperties/interfaces';

import type { IPropertyTemplate } from '../board';
import { proposalDbProperties } from '../proposalDbProperties';

import { filterBoardProperties } from './filterBoardProperties';

// Note: maybe we should instead hav ea whitelist of form field answers that we support?
export const excludedFieldTypes = ['project_profile', 'label', 'optimism_project_profile'];

type PartialPropertyTemplate = Omit<IPropertyTemplate, 'options'>;

// define properties that will apply to all source fields
const defaultOptions = { readOnly: true, readOnlyValues: true, options: [] };

export type EvaluationStep = {
  proposal: {
    page?: {
      type: PageType;
      id?: string | null;
      title: string;
      sourceTemplateId?: string | null;
    } | null;
  };
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
  formFields?: (FormFieldInput & { pageId?: string })[];
}) {
  const proposalTemplateEvaluations = evaluationSteps.filter(
    (step) => step.proposal.page?.type === 'proposal_template'
  );
  const proposalEvaluations = evaluationSteps.filter((step) => step.proposal.page?.type === 'proposal');

  const evaluationStepTitles: Set<string> = new Set();
  for (const evaluationStep of evaluationSteps) {
    evaluationStepTitles.add(evaluationStep.title);
  }

  const boardProperties = [...currentCardProperties];

  // standard proposal properties
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalReviewerNotes());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalAuthor());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalStatus());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalPublishedAt());
  applyToPropertiesByType(boardProperties, proposalDbProperties.proposalEvaluationDueDate());
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

  // custom properties from the original proposals container
  proposalCustomProperties.forEach((cardProp) => {
    applyToPropertiesById(boardProperties, cardProp);
  });

  // properties per each evaluation step
  applyProposalEvaluationProperties(boardProperties, proposalTemplateEvaluations);

  // properties for each unique questions on rubric evaluation step
  applyRubricEvaluationQuestionProperties(boardProperties, proposalTemplateEvaluations);

  applyRubricEvaluationReviewerProperties(boardProperties, proposalEvaluations, proposalTemplateEvaluations);

  // properties related to form proposals
  applyFormFieldProperties(boardProperties, formFields);

  // properties related to project profile
  applyProjectProfileProperties(boardProperties);

  if (!selectedProperties) {
    return boardProperties;
  }

  return filterBoardProperties({
    boardProperties,
    proposalCustomProperties,
    selectedProperties,
    evaluationSteps: proposalTemplateEvaluations
  });
}

function applyRubricEvaluationReviewerProperties(
  boardProperties: IPropertyTemplate[],
  evaluationSteps: EvaluationStep[],
  templateEvaluationSteps: EvaluationStep[]
) {
  evaluationSteps.forEach((evaluationStep) => {
    const templateEvaluationStep = templateEvaluationSteps.find(
      (step) => step.proposal.page?.id === evaluationStep.proposal.page?.sourceTemplateId
    );
    const templatePage = templateEvaluationStep?.proposal.page;
    if (!templatePage) {
      return;
    }
    if (evaluationStep.type === 'rubric') {
      evaluationStep.rubricCriteria.forEach((rubricCriteria) => {
        rubricCriteria.answers.forEach((answer) => {
          const existingCriteriaReviewerScorePropIndex = boardProperties.findIndex(
            (p) =>
              p.type === 'proposalRubricCriteriaReviewerScore' &&
              p.evaluationTitle === evaluationStep.title &&
              p.criteriaTitle === rubricCriteria.title &&
              p.reviewerId === answer.user.id &&
              p.templateId === templatePage.id
          );
          if (existingCriteriaReviewerScorePropIndex === -1) {
            boardProperties.push({
              id: uuid(),
              type: 'proposalRubricCriteriaReviewerScore',
              name: `${templatePage ? `${templatePage.title} - ` : ''}${evaluationStep.title} - ${
                rubricCriteria.title
              } - ${answer.user.username} - Score`,
              evaluationTitle: evaluationStep.title,
              criteriaTitle: rubricCriteria.title,
              reviewerId: answer.user.id,
              private: false,
              options: [],
              templateId: templatePage.id ?? undefined
            });
          }

          const existingCriteriaReviewerCommentPropIndex = boardProperties.findIndex(
            (p) =>
              p.type === 'proposalRubricCriteriaReviewerComment' &&
              p.evaluationTitle === evaluationStep.title &&
              p.criteriaTitle === rubricCriteria.title &&
              p.reviewerId === answer.user.id &&
              p.templateId === templatePage.id
          );
          if (existingCriteriaReviewerCommentPropIndex === -1) {
            boardProperties.push({
              id: uuid(),
              type: 'proposalRubricCriteriaReviewerComment',
              name: `${templatePage ? `${templatePage.title} - ` : ''}${evaluationStep.title} - ${
                rubricCriteria.title
              } - ${answer.user.username} - Comment`,
              evaluationTitle: evaluationStep.title,
              criteriaTitle: rubricCriteria.title,
              reviewerId: answer.user.id,
              private: false,
              options: [],
              templateId: templatePage.id ?? undefined
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
  for (const evaluationStep of evaluationSteps) {
    if (evaluationStep.type === 'rubric') {
      evaluationStep.rubricCriteria.forEach((rubricCriteria) => {
        const page = evaluationStep.proposal.page;
        const commonProps: Partial<IPropertyTemplate> = {
          evaluationTitle: evaluationStep.title,
          criteriaTitle: rubricCriteria.title,
          private: false,
          readOnly: true,
          readOnlyValues: true,
          templateId: page?.id ?? undefined,
          tooltip: rubricCriteria.description || ''
        };

        applyToPropertiesByTemplateId(boardProperties, {
          ...commonProps,
          id: uuid(),
          type: 'proposalRubricCriteriaTotal',
          name: `${page ? `${page.title} - ` : ''}${evaluationStep.title} - ${rubricCriteria.title} (Criteria total)`
        });

        applyToPropertiesByTemplateId(boardProperties, {
          ...commonProps,
          id: uuid(),
          type: 'proposalRubricCriteriaAverage',
          name: `${page ? `${page.title} - ` : ''}${evaluationStep.title} - ${rubricCriteria.title} (Criteria average)`
        });
      });
    }
  }
}

function applyFormFieldProperties(
  boardProperties: IPropertyTemplate[],
  formFields: (FormFieldInput & { pageId?: string })[]
) {
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
        private: formField.private,
        templateId: formField.pageId
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

function applyToPropertiesByTemplateId(
  boardProperties: IPropertyTemplate[],
  { id, ...fieldProperty }: PartialPropertyTemplate
) {
  const existingPropIndex = boardProperties.findIndex(
    (p) =>
      p.type === fieldProperty.type &&
      p.templateId === fieldProperty.templateId &&
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

function applyProposalEvaluationProperties(
  boardProperties: IPropertyTemplate[],
  evaluationSteps: EvaluationStep[] = []
) {
  for (const evaluationStep of evaluationSteps) {
    const page = evaluationStep.proposal.page;
    applyToPropertiesByTemplateId(boardProperties, {
      id: uuid(),
      type: 'proposalEvaluatedBy',
      name: `${page ? `${page.title} - ` : ''}${evaluationStep.title} (Step reviewers)`,
      evaluationTitle: evaluationStep.title,
      templateId: page?.id ?? undefined
    });

    applyToPropertiesByTemplateId(boardProperties, {
      id: uuid(),
      type: 'proposalEvaluationTotal',
      name: `${page ? `${page.title} - ` : ''}${evaluationStep.title} (Step total)`,
      evaluationTitle: evaluationStep.title,
      templateId: page?.id ?? undefined
    });

    applyToPropertiesByTemplateId(boardProperties, {
      id: uuid(),
      type: 'proposalEvaluationAverage',
      name: `${page ? `${page.title} - ` : ''}${evaluationStep.title} (Step average)`,
      evaluationTitle: evaluationStep.title,
      templateId: page?.id ?? undefined
    });

    applyToPropertiesByTemplateId(boardProperties, {
      id: uuid(),
      type: 'proposalEvaluationReviewerAverage',
      name: `${page ? `${page.title} - ` : ''}${evaluationStep.title} (Step reviewer average)`,
      evaluationTitle: evaluationStep.title,
      templateId: page?.id ?? undefined
    });
  }
}

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
