import { yupResolver } from '@hookform/resolvers/yup';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import type { ProjectEditorFieldConfig, ProjectValues } from 'components/projects/interfaces';
import type { ProjectField } from 'components/projects/ProjectFields';
import { ProjectFieldProperties } from 'components/projects/ProjectFields';
import type { ProjectMemberField } from 'components/projects/ProjectMemberFields';
import { ProjectMemberFieldProperties } from 'components/projects/ProjectMemberFields';

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
