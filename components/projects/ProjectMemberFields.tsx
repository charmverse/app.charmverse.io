import type { ProjectMember } from '@charmverse/core/prisma-client';
import { Stack, Switch, Typography } from '@mui/material';
import * as yup from 'yup';

import { TextInputField } from 'components/common/form/fields/TextInputField';

import type { ProjectEditorFieldConfig } from './interfaces';

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
    <Stack display='flex' flexDirection='column' gap={2} width='100%'>
      {ProjectMemberConstants.map((property) => (
        <TextInputField
          key={property.field}
          label={property.label}
          multiline={property.field === 'previousProjects'}
          rows={property.field === 'previousProjects' ? 5 : 1}
          required={fieldConfig?.[property.field]?.required ?? true}
          disabled={onChange === undefined}
          onChange={(e) => {
            onChange?.({
              ...values,
              [property.field]: e.target.value
            });
          }}
        />
      ))}
    </Stack>
  );
}

export function ProjectMemberFieldsEditor({
  onChange,
  values
}: {
  onChange?: (values: ProjectEditorFieldConfig['members'][number]) => void;
  values: ProjectEditorFieldConfig['members'][number];
}) {
  return (
    <Stack display='flex' flexDirection='column' gap={2}>
      {ProjectMemberConstants.map((property) => (
        <Stack gap={1} key={property.label}>
          <TextInputField
            label={property.label}
            multiline={property.field === 'previousProjects'}
            rows={property.field === 'previousProjects' ? 5 : 1}
            disabled
            required={values?.[property.field]?.required ?? true}
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
                  checked={values?.[property.field]?.required ?? true}
                  onChange={(e) => {
                    onChange({
                      ...(values ?? {}),
                      [property.field]: {
                        ...values?.[property.field],
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
      ))}
    </Stack>
  );
}
