import { yupResolver } from '@hookform/resolvers/yup';
import { ethers } from 'ethers';
import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useGetProjects } from 'charmClient/hooks/projects';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import { projectFieldProperties, projectMemberFieldProperties } from 'lib/projects/constants';
import { getDefaultProjectValues } from 'lib/projects/getDefaultProjectValues';
import type {
  ProjectField,
  ProjectMemberField,
  ProjectAndMembersFieldConfig,
  ProjectWithMembers,
  ProjectAndMembersPayload
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
  fieldConfig: ProjectAndMembersFieldConfig;
  defaultRequired?: boolean;
}) {
  const yupProjectSchemaObject: Partial<Record<ProjectField, yup.StringSchema>> = {};
  const yupProjectMemberSchemaObject: Partial<Record<ProjectMemberField, yup.StringSchema>> = {};
  projectFieldProperties.forEach((projectFieldProperty) => {
    const projectFieldConfig = fieldConfig[projectFieldProperty.field] ?? {
      required: defaultRequired,
      show: true
    };
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
    const projectMemberFieldConfig = fieldConfig.projectMember[projectMemberFieldProperty.field] ?? {
      required: defaultRequired,
      show: true
    };
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

export function convertToProjectValues(projectWithMembers: ProjectWithMembers) {
  return {
    blog: projectWithMembers.blog,
    communityUrl: projectWithMembers.communityUrl,
    description: projectWithMembers.description,
    excerpt: projectWithMembers.excerpt,
    github: projectWithMembers.github,
    name: projectWithMembers.name,
    otherUrl: projectWithMembers.otherUrl,
    demoUrl: projectWithMembers.demoUrl,
    twitter: projectWithMembers.twitter,
    walletAddress: projectWithMembers.walletAddress,
    website: projectWithMembers.website,
    projectMembers: projectWithMembers.projectMembers.map((projectMember) => {
      return {
        warpcast: projectMember.warpcast,
        email: projectMember.email,
        github: projectMember.github,
        linkedin: projectMember.linkedin,
        name: projectMember.name,
        otherUrl: projectMember.otherUrl,
        previousProjects: projectMember.previousProjects,
        telegram: projectMember.telegram,
        twitter: projectMember.twitter,
        walletAddress: projectMember.walletAddress,
        id: projectMember.id,
        userId: projectMember.userId
      };
    })
  } as ProjectAndMembersPayload;
}

export function useProjectForm(options: {
  defaultValues?: ProjectAndMembersPayload;
  fieldConfig: ProjectAndMembersFieldConfig;
  defaultRequired?: boolean;
  projectId?: string | null;
}) {
  const { defaultRequired, defaultValues, fieldConfig } = options;
  const { user } = useUser();
  const { membersRecord } = useMembers();
  const { data: projectsWithMembers } = useGetProjects();
  const projectWithMembers = projectsWithMembers?.find((project) => project.id === options.projectId);

  const defaultProjectAndMembersPayload = useMemo(
    () => getDefaultProjectValues({ user, membersRecord }),
    [user, membersRecord]
  );

  const yupSchema = useRef(yup.object());

  useEffect(() => {
    yupSchema.current = createProjectYupSchema({
      fieldConfig,
      defaultRequired
    });
  }, [fieldConfig, defaultRequired]);

  const defaultProjectWithMembers = useMemo(() => {
    if (!projectWithMembers) {
      return undefined;
    }
    return convertToProjectValues(projectWithMembers);
  }, [projectWithMembers]);

  const form = useForm({
    defaultValues: defaultProjectWithMembers ?? defaultValues ?? defaultProjectAndMembersPayload,
    reValidateMode: 'onChange',
    resolver: yupResolver(yupSchema.current),
    criteriaMode: 'all',
    mode: 'onChange'
  });

  useEffect(() => {
    if (options.projectId) {
      form.reset(projectWithMembers);
    } else {
      form.reset(defaultProjectAndMembersPayload);
    }
  }, [options.projectId]);

  return form;
}
