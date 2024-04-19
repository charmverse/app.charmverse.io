import type { FormField, FormFieldAnswer } from '@charmverse/core/prisma-client';

import type { FormFieldValue } from 'components/common/form/interfaces';
import { PROJECT_MEMBER_NAMES_ID, PROJECT_NAME_ID } from 'lib/proposals/blocks/constants';

export type FormFieldData = Pick<FormField, 'id' | 'type' | 'private'>;
export type FormAnswerData = Pick<FormFieldAnswer, 'value' | 'fieldId'>;

type PropertiesMap = Record<string, FormFieldValue>;

export type ProjectInformation = {
  name: string;
  projectMembers: { name: string }[];
};

export function getCardPropertiesFromProject(project: ProjectInformation): PropertiesMap {
  return {
    [PROJECT_NAME_ID]: project.name,
    [PROJECT_MEMBER_NAMES_ID]: project.projectMembers.map((member) => member.name)
  };
}
