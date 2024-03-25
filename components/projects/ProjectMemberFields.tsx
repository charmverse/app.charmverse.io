import type { ProjectMember } from '@charmverse/core/prisma-client';

import { FieldAnswers } from './FormFields/FieldAnswers';
import { FieldsEditor } from './FormFields/FieldsEditor';
import type {
  ProjectEditorFieldConfig,
  ProjectFieldConfig,
  ProjectFieldProperty,
  ProjectUpdatePayload
} from './interfaces';

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

export const ProjectMemberFieldProperties: ProjectFieldProperty[] = [
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
  fieldConfig,
  defaultRequired,
  projectMemberIndex,
  disabled
}: {
  projectMemberIndex: number;
  fieldConfig?: ProjectFieldConfig;
  defaultRequired?: boolean;
  disabled?: boolean;
}) {
  return (
    <FieldAnswers
      defaultRequired={defaultRequired}
      disabled={disabled}
      name={`projectMembers[${projectMemberIndex}]`}
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
