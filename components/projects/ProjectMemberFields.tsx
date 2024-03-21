import type { ProjectMember } from '@charmverse/core/prisma-client';
import * as yup from 'yup';

import { FieldAnswers } from './FormFields/FieldAnswers';
import { FieldsEditor } from './FormFields/FieldsEditor';
import type { ProjectEditorFieldConfig, ProjectFieldProperty } from './interfaces';

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

const ProjectMemberConstants: ProjectFieldProperty<ProjectMemberField>[] = [
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

const schema = yup.object().shape({
  name: yup.string().required(),
  walletAddress: yup.string().required(),
  email: yup.string().email().required(),
  twitter: yup.string().nullable(),
  warpcast: yup.string().nullable(),
  github: yup.string().nullable(),
  linkedin: yup.string().nullable(),
  telegram: yup.string().nullable(),
  otherUrl: yup.string().nullable(),
  previousProjects: yup.string().nullable()
});

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

export const projectMemberRequiredValues: Record<ProjectMemberField, boolean> = {
  name: true,
  walletAddress: true,
  email: true,
  twitter: true,
  warpcast: true,
  github: true,
  linkedin: true,
  telegram: true,
  otherUrl: true,
  previousProjects: true
};

export function ProjectMemberFieldAnswers({
  onChange,
  values,
  fieldConfig,
  defaultRequired
}: {
  fieldConfig?: ProjectEditorFieldConfig['projectMembers'][number];
  onChange?: (projectMember: ProjectMemberPayload) => void;
  values: ProjectMemberPayload;
  defaultRequired?: boolean;
}) {
  return (
    <FieldAnswers
      defaultRequired={defaultRequired}
      values={values}
      onChange={onChange}
      fieldConfig={fieldConfig}
      properties={ProjectMemberConstants}
    />
  );
}

export function ProjectMemberFieldsEditor({
  onChange,
  values,
  defaultRequired
}: {
  defaultRequired?: boolean;
  onChange?: (values: ProjectEditorFieldConfig['projectMembers'][number]) => void;
  values: ProjectEditorFieldConfig['projectMembers'][number];
}) {
  return (
    <FieldsEditor
      defaultRequired={defaultRequired}
      properties={ProjectMemberConstants}
      values={values}
      onChange={onChange}
    />
  );
}
