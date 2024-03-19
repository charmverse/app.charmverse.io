import type { ProjectMember } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { Stack } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';

import { FieldTypeRenderer } from 'components/common/form/fields/FieldTypeRenderer';

type ProjectMemberPayload = Pick<
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

type ProjectMemberField = keyof ProjectMemberPayload;

type Props = {
  onChange: (values: any) => void;
};

const ProjectMemberConstants: {
  field: ProjectMemberField;
  required: boolean;
  label: string;
}[] = [
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
    label: 'Previous Projects'
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

export function ProjectMemberFields({ onChange }: Props) {
  const {
    control,
    formState: { errors },
    watch,
    setValue,
    handleSubmit
  } = useForm<ProjectMemberPayload>({
    defaultValues: {
      name: '',
      walletAddress: '',
      email: '',
      twitter: '',
      warpcast: '',
      github: '',
      linkedin: '',
      telegram: '',
      otherUrl: ''
    },
    resolver: yupResolver(schema)
  });

  return (
    <Stack display='flex' flexDirection='column' gap={2}>
      {ProjectMemberConstants.map((property) => (
        <Controller
          key={property.label}
          name={property.field}
          control={control}
          render={({ field }) => (
            <FieldTypeRenderer
              {...field}
              rows={property.field === 'previousProjects' ? 5 : 1}
              value={field.value ?? ''}
              type='text'
              label={property.label}
              error={errors[property.field] as any}
              required={property.required}
              onChange={(e) => {
                field.onChange(e);
              }}
            />
          )}
        />
      ))}
    </Stack>
  );
}
