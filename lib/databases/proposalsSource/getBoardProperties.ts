import { v4 as uuid } from 'uuid';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { FormFieldInput } from 'components/common/form/interfaces';
import type { IPropertyTemplate } from 'lib/databases/board';
import { proposalDbProperties } from 'lib/databases/proposalDbProperties';
import { getFieldConfig } from 'lib/projects/formField';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/formField';
import * as constants from 'lib/proposals/blocks/constants';
import type { PageContent } from 'lib/prosemirror/interfaces';

// Note: maybe we should instead hav ea whitelist of form field answers that we support?
export const excludedFieldTypes = ['project_profile', 'label'];

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
  applyToPropertiesById(boardProperties, {
    id: constants.PROJECT_NAME_ID,
    name: 'Project',
    options: [],
    type: 'text'
  });
  if (getFieldConfig(fieldConfig.excerpt).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_EXCERPT_ID,
      name: 'Project Excerpt',
      options: [],
      type: 'text'
    });
  }
  if (getFieldConfig(fieldConfig.description).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_DESCRIPTION_ID,
      name: 'Project Excerpt',
      options: [],
      type: 'text'
    });
  }
  if (getFieldConfig(fieldConfig.twitter).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_TWITTER_ID,
      name: 'Project X Account',
      options: [],
      type: 'text'
    });
  }
  if (getFieldConfig(fieldConfig.website).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_WEBSITE_ID,
      name: 'Project Website',
      options: [],
      type: 'text'
    });
  }
  if (getFieldConfig(fieldConfig.github).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_GITHUB_ID,
      name: 'Project Github',
      options: [],
      type: 'text'
    });
  }
  if (getFieldConfig(fieldConfig.blog).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_BLOG_ID,
      name: 'Project Blog',
      options: [],
      type: 'text'
    });
  }
  if (getFieldConfig(fieldConfig.demoUrl).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_DEMO_URL_ID,
      name: 'Project Demo',
      options: [],
      type: 'text'
    });
  }
  if (getFieldConfig(fieldConfig.communityUrl).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_COMMUNITY_URL_ID,
      name: 'Project Community',
      options: [],
      type: 'text'
    });
  }
  if (getFieldConfig(fieldConfig.otherUrl).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_OTHER_URL_ID,
      name: 'Project Other Url',
      options: [],
      type: 'text'
    });
  }
  if (getFieldConfig(fieldConfig.walletAddress).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_WALLET_ID,
      name: 'Project Wallet',
      options: [],
      private: getFieldConfig(fieldConfig.walletAddress).private,
      type: 'text'
    });
  }
  // member properties
  applyToPropertiesById(boardProperties, {
    id: constants.PROJECT_MEMBER_NAMES_ID,
    name: 'Project Members',
    options: [],
    type: 'multiSelect'
  });
  if (getFieldConfig(fieldConfig.projectMember.walletAddress).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_MEMBER_WALLETS_ID,
      name: 'Project Member Wallets',
      options: [],
      private: getFieldConfig(fieldConfig.projectMember.walletAddress).private,
      type: 'multiSelect'
    });
  }
  if (getFieldConfig(fieldConfig.projectMember.email).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_MEMBER_EMAILS_ID,
      name: 'Project Member Emails',
      options: [],
      private: getFieldConfig(fieldConfig.projectMember.email).private,
      type: 'multiSelect'
    });
  }
  if (getFieldConfig(fieldConfig.projectMember.twitter).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_MEMBER_TWITTERS_ID,
      name: 'Project Member X Accounts',
      options: [],
      type: 'multiSelect'
    });
  }
  if (getFieldConfig(fieldConfig.projectMember.warpcast).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_MEMBER_WARPCASTS_ID,
      name: 'Project Member Warpcast',
      options: [],
      type: 'multiSelect'
    });
  }
  if (getFieldConfig(fieldConfig.projectMember.github).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_MEMBER_GITHUBS_ID,
      name: 'Project Member Github',
      options: [],
      type: 'multiSelect'
    });
  }
  if (getFieldConfig(fieldConfig.projectMember.linkedin).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_MEMBER_LINKEDINS_ID,
      name: 'Project Member LinkedIn',
      options: [],
      type: 'multiSelect'
    });
  }
  if (getFieldConfig(fieldConfig.projectMember.telegram).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_MEMBER_TELEGRAMS_ID,
      name: 'Project Member Telegram',
      options: [],
      type: 'multiSelect'
    });
  }
  if (getFieldConfig(fieldConfig.projectMember.otherUrl).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_MEMBER_OTHER_URLS_ID,
      name: 'Project Member URLs',
      options: [],
      type: 'multiSelect'
    });
  }
  if (getFieldConfig(fieldConfig.projectMember.previousProjects).show) {
    applyToPropertiesById(boardProperties, {
      id: constants.PROJECT_MEMBER_PREVIOUS_PROJECTS_ID,
      name: 'Project Member Previous Projects',
      options: [],
      type: 'multiSelect'
    });
  }
}

function applyProposalEvaluationProperties(boardProperties: IPropertyTemplate[], rubricStepTitles: string[]) {
  for (const rubricStepTitle of rubricStepTitles) {
    applyToPropertiesByTypeAndName(boardProperties, {
      id: uuid(),
      type: 'proposalEvaluatedBy',
      name: rubricStepTitle,
      options: []
    });
    applyToPropertiesByTypeAndName(boardProperties, {
      id: uuid(),
      type: 'proposalEvaluationTotal',
      name: rubricStepTitle,
      options: []
    });
    applyToPropertiesByTypeAndName(boardProperties, {
      id: uuid(),
      type: 'proposalEvaluationAverage',
      name: rubricStepTitle,
      options: []
    });
  }
}

function applyToPropertiesById(boardProperties: IPropertyTemplate[], fieldProperty: IPropertyTemplate) {
  const existingProp = boardProperties.find((p) => p.id === fieldProperty.id);
  if (!existingProp) {
    boardProperties.push(fieldProperty);
  } else {
    Object.assign(existingProp, fieldProperty);
  }
}

function applyToPropertiesByType(boardProperties: IPropertyTemplate[], { id, ...fieldProperty }: IPropertyTemplate) {
  const existingProp = boardProperties.find((p) => p.type === fieldProperty.type);
  if (!existingProp) {
    boardProperties.push({ id, ...fieldProperty });
  } else {
    Object.assign(existingProp, fieldProperty);
  }
}

function applyToPropertiesByTypeAndName(
  boardProperties: IPropertyTemplate[],
  { id, ...fieldProperty }: IPropertyTemplate
) {
  const existingProp = boardProperties.find((p) => p.type === fieldProperty.type && p.name === fieldProperty.name);
  if (!existingProp) {
    boardProperties.push({ id, ...fieldProperty });
  } else {
    Object.assign(existingProp, fieldProperty);
  }
}

function applyFormFieldToProperties(boardProperties: IPropertyTemplate[], { id, ...fieldProperty }: IPropertyTemplate) {
  const existingProp = boardProperties.find((p) => p.formFieldId === fieldProperty.formFieldId);
  if (!existingProp) {
    boardProperties.push({
      id,
      ...fieldProperty
    });
  } else {
    Object.assign(existingProp, fieldProperty);
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
