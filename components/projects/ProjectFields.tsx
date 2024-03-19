import type { Project } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { Stack, Switch, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';

import { FieldTypeRenderer } from 'components/common/form/fields/FieldTypeRenderer';
import { TextInputField } from 'components/common/form/fields/TextInputField';

import type { ProjectRequiredFieldValues } from './interfaces';

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

type Props = {
  onChange?: (project: ProjectPayload) => void;
  defaultValues?: ProjectPayload;
  requiredValues?: Omit<ProjectRequiredFieldValues, 'members'>;
};

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

export function ProjectFields({ requiredValues = {}, onChange, defaultValues }: Props) {
  const {
    control,
    watch,
    formState: { errors }
  } = useForm<ProjectPayload>({
    defaultValues,
    resolver: yupResolver(schema)
  });

  const project = watch();

  return (
    <Stack gap={2}>
      {ProjectConstants.map((property) => {
        return (
          <Controller
            key={property.label}
            name={property.field}
            control={control}
            render={({ field }) => (
              <FieldTypeRenderer
                {...field}
                rows={property.field === 'excerpt' ? 3 : property.field === 'description' ? 5 : 1}
                value={field.value ?? ''}
                type='text'
                label={property.label}
                error={errors[property.field] as any}
                required={requiredValues[property.field] ?? true}
                disabled={onChange === undefined}
                onChange={(e: any) => {
                  field.onChange(e);
                  onChange?.({
                    ...project,
                    [property.field]: e.target.value
                  });
                }}
              />
            )}
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
  onChange?: (value: Omit<ProjectRequiredFieldValues, 'members'>) => void;
  values: Omit<ProjectRequiredFieldValues, 'members'>;
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
              required={values[property.field] ?? true}
            />
            {onChange && (
              <Stack gap={0.5} flexDirection='row' alignItems='center'>
                <Switch
                  size='small'
                  checked={values[property.field] ?? true}
                  onChange={(e) => {
                    onChange({
                      ...values,
                      [property.field]: e.target.checked
                    });
                  }}
                />
                <Typography>Required</Typography>
              </Stack>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
