import { isValidEmail } from '@packages/utils/strings';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { projectFieldProperties, projectMemberFieldProperties } from './formField';
import type { ProjectField, ProjectMemberField, ProjectAndMembersFieldConfig } from './formField';

type FieldSchema = yup.StringSchema | yup.ArraySchema<(string | undefined)[] | undefined, yup.AnyObject, '', ''>;

function addMatchersToSchema({
  fieldType,
  isRequired,
  schemaObject
}: {
  fieldType: ProjectField | ProjectMemberField;
  isRequired: boolean;
  schemaObject: Record<string, FieldSchema>;
}) {
  if (fieldType === 'walletAddress') {
    schemaObject[fieldType] = (schemaObject[fieldType] as yup.StringSchema).test(
      'is-valid-address',
      'Invalid wallet address',
      (value) => {
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
      }
    );
  } else if (fieldType === 'email') {
    schemaObject[fieldType] = (schemaObject[fieldType] as yup.StringSchema).test(
      'is-valid-email',
      'Invalid email address',
      (value) => {
        if (isRequired && !value) {
          return false;
        }

        if (value) {
          return isValidEmail(value);
        }

        return true;
      }
    );
  }
}

export function createProjectYupSchema({ fieldConfig: fieldsConfig }: { fieldConfig?: ProjectAndMembersFieldConfig }) {
  const yupProjectSchemaObject: Partial<Record<ProjectField, FieldSchema>> = {};
  const yupProjectMemberSchemaObject: Partial<Record<ProjectMemberField, FieldSchema>> = {};
  projectFieldProperties.forEach(({ field, multiple }) => {
    const fieldConfig = fieldsConfig?.[field] ?? {
      required: false,
      show: true
    };

    fieldConfig.required = fieldConfig.required ?? false;

    if (fieldConfig.show !== false) {
      let fieldSchema = multiple ? yup.array().of(yup.string()) : yup.string();
      if (fieldConfig.required) {
        fieldSchema = fieldSchema.required();
      }
      yupProjectSchemaObject[field as ProjectField] = fieldSchema;

      addMatchersToSchema({
        fieldType: field as ProjectField | ProjectMemberField,
        isRequired: !!fieldConfig.required,
        schemaObject: yupProjectSchemaObject
      });
    }
  });

  projectMemberFieldProperties.forEach(({ field, multiple }) => {
    const fieldConfig = fieldsConfig?.projectMember[field] ?? {
      required: false,
      show: true
    };

    fieldConfig.required = fieldConfig.required ?? false;

    if (fieldConfig.show !== false) {
      let fieldSchema = multiple ? yup.array().of(yup.string()) : yup.string();
      if (fieldConfig.required) {
        fieldSchema = fieldSchema.required();
      }
      yupProjectMemberSchemaObject[field as ProjectMemberField] = fieldSchema;

      addMatchersToSchema({
        fieldType: field as ProjectField | ProjectMemberField,
        isRequired: !!fieldConfig.required,
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
