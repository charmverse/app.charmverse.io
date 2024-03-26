import { yupResolver } from '@hookform/resolvers/yup';
import { ethers } from 'ethers';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import {
  projectFieldProperties,
  projectMemberFieldProperties,
  defaultProjectFieldConfig
} from 'lib/projects/constants';
import { getDefaultProjectValues } from 'lib/projects/getDefaultProjectValues';
import type {
  ProjectField,
  ProjectMemberField,
  ProjectEditorFieldConfig,
  ProjectWithMembers,
  ProjectValues
} from 'lib/projects/interfaces';

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
          return ethers.utils.isAddress(value) || value.endsWith('.eth');
        }

        return true;
      } catch {
        return false;
      }
    });
  } else if (fieldType === 'email') {
    schemaObject[fieldType] = schemaObject[fieldType]!.email('Invalid email');
  }
}

export function createProjectYupSchema({
  fieldConfig,
  defaultRequired = false
}: {
  fieldConfig: ProjectEditorFieldConfig;
  defaultRequired?: boolean;
}) {
  const yupProjectSchemaObject: Partial<Record<ProjectField, yup.StringSchema>> = {};
  const yupProjectMemberSchemaObject: Partial<Record<ProjectMemberField, yup.StringSchema>> = {};
  projectFieldProperties.forEach((projectFieldProperty) => {
    const projectFieldConfig = fieldConfig[projectFieldProperty.field] ?? {
      required: defaultRequired,
      hidden: false
    };
    if (!projectFieldConfig.hidden) {
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
    const projectMemberFieldConfig = fieldConfig.projectMember[projectMemberFieldProperty.field] ?? {
      required: defaultRequired,
      hidden: false
    };
    if (!projectMemberFieldConfig.hidden) {
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

export function convertToProjectValues(projectWithMembers: ProjectWithMembers) {
  return {
    blog: projectWithMembers.blog,
    communityUrl: projectWithMembers.communityUrl,
    description: projectWithMembers.description,
    excerpt: projectWithMembers.excerpt,
    github: projectWithMembers.github,
    name: projectWithMembers.name,
    otherUrl: projectWithMembers.otherUrl,
    productUrl: projectWithMembers.productUrl,
    twitter: projectWithMembers.twitter,
    walletAddress: projectWithMembers.walletAddress,
    website: projectWithMembers.website,
    projectMembers: projectWithMembers.projectMembers.map((projectMember) => {
      return {
        email: projectMember.email,
        github: projectMember.github,
        linkedin: projectMember.linkedin,
        name: projectMember.name,
        otherUrl: projectMember.otherUrl,
        previousProjects: projectMember.previousProjects,
        telegram: projectMember.telegram,
        twitter: projectMember.twitter,
        walletAddress: projectMember.walletAddress
      };
    })
  } as ProjectValues;
}

export function useProjectForm(options?: {
  defaultValues?: ProjectValues;
  projectWithMembers?: ProjectWithMembers;
  fieldConfig?: ProjectEditorFieldConfig;
  defaultRequired?: boolean;
}) {
  const { defaultRequired, defaultValues, fieldConfig = defaultProjectFieldConfig, projectWithMembers } = options ?? {};
  const { user } = useUser();
  const { membersRecord } = useMembers();

  const defaultProjectValues = useMemo(() => getDefaultProjectValues({ user, membersRecord }), [user, membersRecord]);

  const defaultProjectWithMembers = useMemo(() => {
    if (!projectWithMembers) {
      return undefined;
    }
    return convertToProjectValues(projectWithMembers);
  }, [projectWithMembers]);

  const form = useForm({
    defaultValues: defaultProjectWithMembers ?? defaultValues ?? defaultProjectValues,
    reValidateMode: 'onChange',
    resolver: yupResolver(
      createProjectYupSchema({
        fieldConfig,
        defaultRequired
      })
    ),
    criteriaMode: 'all',
    mode: 'onChange'
  });

  return form;
}
