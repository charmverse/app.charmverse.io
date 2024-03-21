import { yupResolver } from '@hookform/resolvers/yup';
import { ethers } from 'ethers';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import {
  GITHUB_URL_REGEX,
  LINKEDIN_URL_REGEX,
  TWITTER_URL_REGEX
} from 'components/members/hooks/useRequiredMemberProperties';
import type { ProjectEditorFieldConfig, ProjectValues } from 'components/projects/interfaces';
import type { ProjectField } from 'components/projects/ProjectFields';
import { ProjectFieldProperties } from 'components/projects/ProjectFields';
import type { ProjectMemberField } from 'components/projects/ProjectMemberFields';
import { ProjectMemberFieldProperties } from 'components/projects/ProjectMemberFields';

function addMatchersToSchema({
  fieldType,
  isRequired,
  schemaObject
}: {
  fieldType: ProjectField | ProjectMemberField;
  isRequired: boolean;
  schemaObject: Record<string, yup.StringSchema>;
}) {
  if (fieldType === 'twitter') {
    schemaObject[fieldType] = schemaObject[fieldType]!.matches(TWITTER_URL_REGEX, 'Invalid Twitter URL');
  } else if (fieldType === 'github') {
    schemaObject[fieldType] = schemaObject[fieldType]!.matches(GITHUB_URL_REGEX, 'Invalid GitHub URL');
  } else if (fieldType === 'walletAddress') {
    schemaObject[fieldType] = schemaObject[fieldType]!.test('is-valid-address', 'Invalid wallet address', (value) => {
      try {
        if (isRequired && !value) {
          return false;
        }

        if (value) {
          return ethers.utils.isAddress(value);
        }

        return true;
      } catch {
        return false;
      }
    });
  } else if (fieldType === 'linkedin') {
    schemaObject[fieldType] = schemaObject[fieldType]!.matches(LINKEDIN_URL_REGEX, 'Invalid LinkedIn URL');
  } else if (fieldType === 'email') {
    schemaObject[fieldType] = schemaObject[fieldType]!.email('Invalid email');
  }
}

export function createProjectYupSchema({
  fieldConfig,
  defaultRequired
}: {
  defaultRequired?: boolean;
  fieldConfig: ProjectEditorFieldConfig;
}) {
  const yupProjectSchemaObject: Partial<Record<ProjectField, yup.StringSchema>> = {};
  const yupProjectMemberSchemaObject: Partial<Record<ProjectMemberField, yup.StringSchema>> = {};

  ProjectFieldProperties.forEach((projectFieldProperty) => {
    const projectFieldConfig = fieldConfig[projectFieldProperty.field] ?? {
      required: !!defaultRequired,
      hidden: false
    };
    if (!projectFieldConfig.hidden) {
      if (projectFieldConfig.required) {
        yupProjectSchemaObject[projectFieldProperty.field] = yup.string().required();
      } else {
        yupProjectSchemaObject[projectFieldProperty.field] = yup.string();
      }

      addMatchersToSchema({
        fieldType: projectFieldProperty.field,
        isRequired: !!projectFieldConfig.required,
        schemaObject: yupProjectSchemaObject
      });
    }
  });

  ProjectMemberFieldProperties.forEach((projectMemberFieldProperty) => {
    const projectMemberFieldConfig = fieldConfig.projectMember[projectMemberFieldProperty.field] ?? {
      required: !!defaultRequired,
      hidden: false
    };
    if (!projectMemberFieldConfig.hidden) {
      if (projectMemberFieldConfig.required) {
        yupProjectMemberSchemaObject[projectMemberFieldProperty.field] = yup.string().required();
      } else {
        yupProjectMemberSchemaObject[projectMemberFieldProperty.field] = yup.string();
      }

      addMatchersToSchema({
        fieldType: projectMemberFieldProperty.field,
        isRequired: !!projectMemberFieldConfig.required,
        schemaObject: yupProjectMemberSchemaObject
      });
    }
  });

  return yup
    .object({
      projectMembers: yup.array().of(yup.object(yupProjectMemberSchemaObject))
    })
    .concat(yup.object(yupProjectSchemaObject));
}

export function useProjectForm({
  defaultValues,
  fieldConfig,
  defaultRequired
}: {
  defaultRequired?: boolean;
  defaultValues?: ProjectValues;
  fieldConfig: ProjectEditorFieldConfig;
}) {
  const yupSchema = useRef(
    createProjectYupSchema({
      fieldConfig,
      defaultRequired
    })
  );

  const { control, formState } = useForm({
    defaultValues,
    reValidateMode: 'onChange',
    resolver: yupResolver(yupSchema.current),
    criteriaMode: 'all'
  });

  return {
    isValid: formState.isValid,
    errors: formState.errors,
    control,
    yupSchema
  };
}
