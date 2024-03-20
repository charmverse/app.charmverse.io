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
    required: true,
    label: 'Name'
  },
  {
    field: 'walletAddress',
    required: true,
    label: 'Wallet Address'
  },
  {
    field: 'twitter',
    required: false,
    label: 'Twitter'
  },
  {
    field: 'warpcast',
    required: false,
    label: 'Warpcast'
  },
  {
    field: 'github',
    required: false,
    label: 'GitHub'
  },
  {
    field: 'linkedin',
    required: false,
    label: 'LinkedIn'
  },
  {
    field: 'email',
    required: true,
    label: 'Email'
  },
  {
    field: 'telegram',
    required: false,
    label: 'Telegram'
  },
  {
    field: 'otherUrl',
    required: false,
    label: 'Other URL'
  },
  {
    field: 'previousProjects',
    required: false,
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
  fieldConfig
}: {
  fieldConfig?: ProjectEditorFieldConfig['members'][number];
  onChange?: (projectMember: ProjectMemberPayload) => void;
  values: ProjectMemberPayload;
}) {
  return (
    <FieldAnswers values={values} onChange={onChange} fieldConfig={fieldConfig} properties={ProjectMemberConstants} />
  );
}

export function ProjectMemberFieldsEditor({
  onChange,
  values
}: {
  onChange?: (values: ProjectEditorFieldConfig['members'][number]) => void;
  values: ProjectEditorFieldConfig['members'][number];
}) {
  return <FieldsEditor properties={ProjectMemberConstants} values={values} onChange={onChange} />;
}
