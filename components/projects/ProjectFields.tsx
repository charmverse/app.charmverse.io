import type { Project } from '@charmverse/core/prisma-client';
import { Stack, Switch, Typography } from '@mui/material';
import * as yup from 'yup';

import { TextInputField } from 'components/common/form/fields/TextInputField';

import type { ProjectEditorFieldConfig } from './interfaces';

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
  fieldConfig?: ProjectEditorFieldConfig;
}) {
  return (
    <Stack gap={2}>
      {ProjectConstants.map((property) => {
        return (
          <TextInputField
            key={property.field}
            label={property.label}
            multiline={property.field === 'excerpt' || property.field === 'description'}
            rows={property.field === 'excerpt' ? 3 : property.field === 'description' ? 5 : 1}
            required={fieldConfig?.[property.field]?.required ?? true}
            disabled={onChange === undefined}
            onChange={(e) => {
              onChange?.({
                ...values,
                [property.field]: e.target.value
              });
            }}
          />
        );
      })}
    </Stack>
  );
}

export function ProjectFieldsEditor({
  onChange,
  values
}: {
  onChange?: (value: Omit<ProjectEditorFieldConfig, 'members'>) => void;
  values: Omit<ProjectEditorFieldConfig, 'members'>;
}) {
  return (
    <Stack gap={2}>
      {ProjectConstants.map((property) => {
        return (
          <Stack gap={1} key={property.label}>
            <TextInputField
              label={property.label}
              multiline={property.field === 'excerpt' || property.field === 'description'}
              rows={property.field === 'excerpt' ? 3 : property.field === 'description' ? 5 : 1}
              disabled
              required={values[property.field]?.required ?? true}
            />
            {onChange && (
              <Stack gap={1}>
                <Stack gap={0.5} flexDirection='row' alignItems='center'>
                  <Switch
                    size='small'
                    checked={values?.[property.field]?.hidden ?? true}
                    onChange={(e) => {
                      onChange({
                        ...(values ?? {}),
                        [property.field]: {
                          ...values?.[property.field],
                          hidden: e.target.checked
                        }
                      });
                    }}
                  />
                  <Typography>Hidden</Typography>
                </Stack>
                <Stack gap={0.5} flexDirection='row' alignItems='center'>
                  <Switch
                    size='small'
                    checked={values[property.field]?.required ?? true}
                    onChange={(e) => {
                      onChange({
                        ...values,
                        [property.field]: {
                          ...values[property.field],
                          required: e.target.checked
                        }
                      });
                    }}
                  />
                  <Typography>Required</Typography>
                </Stack>
              </Stack>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
