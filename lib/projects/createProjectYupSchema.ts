import { isValidEmail } from '@root/lib/utils/strings';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { projectFieldProperties, projectMemberFieldProperties } from './formField';
import type { ProjectField, ProjectMemberField, ProjectAndMembersFieldConfig } from './formField';

function addMatchersToSchema({
  fieldType,
  isRequired,
  schemaObject
}: {
  fieldType: ProjectField | ProjectMemberField;
  isRequired: boolean;
  schemaObject: Record<string, yup.StringSchema>;
}) {
  if (fieldType === 'walletAddress') {
    schemaObject[fieldType] = schemaObject[fieldType]!.test('is-valid-address', 'Invalid wallet address', (value) => {
      try {
        if (isRequired && !value) {
          return false;
        }

        if (value) {
          return value.endsWith('.eth') || isAddress(value);
        }

        return true;
      } catch {
        return false;
      }
    });
  } else if (fieldType === 'email') {
    schemaObject[fieldType] = schemaObject[fieldType]!.test('is-valid-email', 'Invalid email address', (value) => {
      if (isRequired && !value) {
        return false;
      }

      if (value) {
        return isValidEmail(value);
      }

      return true;
    });
  }
}

export function createProjectYupSchema({ fieldConfig }: { fieldConfig?: ProjectAndMembersFieldConfig }) {
  const yupProjectSchemaObject: Partial<Record<ProjectField, yup.StringSchema>> = {};
  const yupProjectMemberSchemaObject: Partial<Record<ProjectMemberField, yup.StringSchema>> = {};
  projectFieldProperties.forEach((projectFieldProperty) => {
    const projectFieldConfig = fieldConfig?.[projectFieldProperty.field] ?? {
      required: false,
      show: true
    };

    projectFieldConfig.required = projectFieldConfig.required ?? false;

    if (projectFieldConfig.show !== false) {
      if (projectFieldConfig.required) {
        yupProjectSchemaObject[projectFieldProperty.field as ProjectField] = yup.string().required();
      } else {
        yupProjectSchemaObject[projectFieldProperty.field as ProjectField] = yup.string();
      }

      addMatchersToSchema({
        fieldType: projectFieldProperty.field as ProjectField | ProjectMemberField,
        isRequired: !!projectFieldConfig.required,
        schemaObject: yupProjectSchemaObject
      });
    }
  });

  projectMemberFieldProperties.forEach((projectMemberFieldProperty) => {
    const projectMemberFieldConfig = fieldConfig?.projectMember[projectMemberFieldProperty.field] ?? {
      required: false,
      show: true
    };
    projectMemberFieldConfig.required = projectMemberFieldConfig.required ?? false;
    if (projectMemberFieldConfig.show !== false) {
      if (projectMemberFieldConfig.required) {
        yupProjectMemberSchemaObject[projectMemberFieldProperty.field as ProjectMemberField] = yup.string().required();
      } else {
        yupProjectMemberSchemaObject[projectMemberFieldProperty.field as ProjectMemberField] = yup.string();
      }

      addMatchersToSchema({
        fieldType: projectMemberFieldProperty.field as ProjectField | ProjectMemberField,
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
