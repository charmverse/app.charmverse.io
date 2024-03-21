import type { Project } from '@charmverse/core/prisma-client';
import * as yup from 'yup';

import { FieldAnswers } from './FormFields/FieldAnswers';
import { FieldsEditor } from './FormFields/FieldsEditor';
import type { ProjectEditorFieldConfig, ProjectFieldConfig, ProjectFieldProperty } from './interfaces';

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

const ProjectConstants: ProjectFieldProperty<ProjectField>[] = [
  {
    field: 'name',
    label: 'Project Name'
  },
  {
    field: 'excerpt',
    label: 'Describe your project in one sentence',
    multiline: true,
    rows: 3
  },
  {
    field: 'description',
    label: 'Describe your project in more depth',
    multiline: true,
    rows: 5
  },
  {
    field: 'twitter',
    label: 'Twitter'
  },
  {
    field: 'website',
    label: 'Website'
  },
  {
    field: 'github',
    label: 'GitHub'
  },
  {
    field: 'blog',
    label: 'Blog'
  },
  {
    field: 'productUrl',
    label: 'Product or Demo URL'
  },
  {
    field: 'communityUrl',
    label: 'Community URL (Discord/Discourse/Farcaster channel)'
  },
  {
    field: 'otherUrl',
    label: 'Other URL'
  },
  {
    field: 'walletAddress',
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
  values,
  defaultRequired
}: {
  onChange?: (project: ProjectPayload) => void;
  values: ProjectPayload;
  fieldConfig?: ProjectFieldConfig;
  defaultRequired?: boolean;
}) {
  return (
    <FieldAnswers
      defaultRequired={defaultRequired}
      values={values}
      onChange={onChange}
      fieldConfig={fieldConfig}
      properties={ProjectConstants}
    />
  );
}

export function ProjectFieldsEditor({
  onChange,
  values,
  defaultRequired
}: {
  defaultRequired?: boolean;
  onChange?: (value: Omit<ProjectEditorFieldConfig, 'members'>) => void;
  values: Omit<ProjectEditorFieldConfig, 'members'>;
}) {
  return (
    <FieldsEditor defaultRequired={defaultRequired} properties={ProjectConstants} values={values} onChange={onChange} />
  );
}
