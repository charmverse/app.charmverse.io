import type { Project } from '@charmverse/core/prisma-client';
import * as yup from 'yup';

import { FieldAnswers } from './FormFields/FieldAnswers';
import { FieldsEditor } from './FormFields/FieldsEditor';
import type { ProjectEditorFieldConfig, ProjectFieldConfig } from './interfaces';

export type ProjectPayload = Pick<
  Project,
  | 'name'
  | 'excerpt'
  | 'description'
  | 'twitter'
  | 'website'
  | 'github'
  | 'blog'
  | 'productUrl'
  | 'communityUrl'
  | 'otherUrl'
  | 'walletAddress'
>;

export type ProjectField = keyof ProjectPayload;

const ProjectConstants: {
  field: ProjectField;
  required: boolean;
  label: string;
}[] = [
  {
    field: 'name',
    required: true,
    label: 'Project Name'
  },
  {
    field: 'excerpt',
    required: true,
    label: 'Describe your project in one sentence'
  },
  {
    field: 'description',
    required: true,
    label: 'Describe your project in more depth'
  },
  {
    field: 'twitter',
    required: false,
    label: 'Twitter'
  },
  {
    field: 'website',
    required: false,
    label: 'Website'
  },
  {
    field: 'github',
    required: false,
    label: 'GitHub'
  },
  {
    field: 'blog',
    required: false,
    label: 'Blog'
  },
  {
    field: 'productUrl',
    required: false,
    label: 'Product or Demo URL'
  },
  {
    field: 'communityUrl',
    required: false,
    label: 'Community URL (Discord/Discourse/Farcaster channel)'
  },
  {
    field: 'otherUrl',
    required: false,
    label: 'Other URL'
  },
  {
    field: 'walletAddress',
    required: false,
    label: 'Wallet Address to receive funds'
  }
];

const schema = yup.object().shape({
  name: yup.string().required(),
  excerpt: yup.string().required(),
  description: yup.string().required(),
  twitter: yup.string().nullable(),
  website: yup.string().nullable(),
  github: yup.string().nullable(),
  blog: yup.string().nullable(),
  productUrl: yup.string().nullable(),
  communityUrl: yup.string().nullable(),
  otherUrl: yup.string().nullable(),
  walletAddress: yup.string().nullable()
});

export const projectDefaultValues = {
  name: '',
  excerpt: '',
  description: '',
  twitter: '',
  website: '',
  github: '',
  blog: '',
  productUrl: '',
  communityUrl: '',
  otherUrl: '',
  walletAddress: ''
};

export const projectRequiredValues: Record<ProjectField, boolean> = {
  name: true,
  excerpt: true,
  description: true,
  twitter: true,
  website: true,
  github: true,
  blog: true,
  productUrl: true,
  communityUrl: true,
  otherUrl: true,
  walletAddress: true
};

export function ProjectFieldAnswers({
  fieldConfig,
  onChange,
  values
}: {
  onChange?: (project: ProjectPayload) => void;
  values: ProjectPayload;
  fieldConfig?: ProjectFieldConfig;
}) {
  return <FieldAnswers values={values} onChange={onChange} fieldConfig={fieldConfig} properties={ProjectConstants} />;
}

export function ProjectFieldsEditor({
  onChange,
  values
}: {
  onChange?: (value: Omit<ProjectEditorFieldConfig, 'members'>) => void;
  values: Omit<ProjectEditorFieldConfig, 'members'>;
}) {
  return <FieldsEditor properties={ProjectConstants} values={values} onChange={onChange} />;
}
