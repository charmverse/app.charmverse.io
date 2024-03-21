import type { ProjectMember } from '@charmverse/core/prisma-client';
import type { Control } from 'react-hook-form';

import { FieldAnswers } from './FormFields/FieldAnswers';
import { FieldsEditor } from './FormFields/FieldsEditor';
import type { ProjectEditorFieldConfig, ProjectFieldProperty, ProjectValues } from './interfaces';

export type ProjectMemberPayload = Pick<
  ProjectMember,
  | 'email'
  | 'github'
  | 'linkedin'
  | 'name'
  | 'otherUrl'
  | 'previousProjects'
  | 'telegram'
  | 'twitter'
  | 'walletAddress'
  | 'warpcast'
>;

export type ProjectMemberField = keyof ProjectMemberPayload;

export const ProjectMemberFieldProperties: ProjectFieldProperty<ProjectMemberField>[] = [
  {
    field: 'name',
    label: 'Name'
  },
  {
    field: 'walletAddress',
    label: 'Wallet Address'
  },
  {
    field: 'twitter',
    label: 'Twitter'
  },
  {
    field: 'warpcast',
    label: 'Warpcast'
  },
  {
    field: 'github',
    label: 'GitHub'
  },
  {
    field: 'linkedin',
    label: 'LinkedIn'
  },
  {
    field: 'email',
    label: 'Email'
  },
  {
    field: 'telegram',
    label: 'Telegram'
  },
  {
    field: 'otherUrl',
    label: 'Other URL'
  },
  {
    field: 'previousProjects',
    label: 'Previous Projects',
    multiline: true,
    rows: 3
  }
];

export const projectMemberDefaultValues: ProjectMemberPayload = {
  name: '',
  walletAddress: '',
  email: '',
  twitter: '',
  warpcast: '',
  github: '',
  linkedin: '',
  telegram: '',
  otherUrl: '',
  previousProjects: ''
};

export function ProjectMemberFieldAnswers({
  onChange,
  values,
  fieldConfig,
  defaultRequired,
  projectMemberIndex,
  control
}: {
  control: Control<ProjectValues, any>;
  projectMemberIndex: number;
  fieldConfig?: ProjectEditorFieldConfig['projectMember'];
  onChange?: (projectMember: ProjectMemberPayload) => void;
  values: ProjectMemberPayload;
  defaultRequired?: boolean;
}) {
  return (
    <FieldAnswers
      defaultRequired={defaultRequired}
      control={control}
      name={`projectMembers[${projectMemberIndex}]`}
      onChange={
        onChange
          ? (_values) => {
              onChange?.({
                ...values,
                ..._values
              });
            }
          : undefined
      }
      fieldConfig={fieldConfig}
      properties={ProjectMemberFieldProperties}
    />
  );
}

export function ProjectMemberFieldsEditor({
  onChange,
  values,
  defaultRequired
}: {
  defaultRequired?: boolean;
  onChange?: (values: ProjectEditorFieldConfig['projectMember']) => void;
  values: ProjectEditorFieldConfig['projectMember'];
}) {
  return (
    <FieldsEditor
      defaultRequired={defaultRequired}
      properties={ProjectMemberFieldProperties}
      values={values}
      onChange={onChange}
    />
  );
}
