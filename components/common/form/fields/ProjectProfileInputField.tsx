import MuiAddIcon from '@mui/icons-material/Add';
import { Box, Divider, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { FormProvider } from 'react-hook-form';

import charmClient from 'charmClient';
import { useGetProjects } from 'charmClient/hooks/projects';
import { convertToProjectValues, useProjectForm } from 'components/settings/projects/hooks/useProjectForm';
import { ProjectFormAnswers } from 'components/settings/projects/ProjectForm';
import { useUser } from 'hooks/useUser';
import { defaultProjectFieldConfig } from 'lib/projects/constants';
import type { ProjectWithMembers, ProjectFieldConfig } from 'lib/projects/interfaces';

import type { FormFieldValue } from '../interfaces';

export function ProjectProfileInputField({
  onChange,
  formField,
  disabled,
  proposalId
}: {
  disabled?: boolean;
  formField: {
    value?: FormFieldValue;
    fieldConfig?: ProjectFieldConfig;
  };
  proposalId?: string;
  onChange: (updatedValue: FormFieldValue) => void;
}) {
  const { user, isLoaded } = useUser();

  if (!user && isLoaded) {
    return <ReadonlyProjectProfileInputField fieldConfig={formField.fieldConfig} proposalId={proposalId} />;
  }

  return <BaseProjectProfileInputField formField={formField} onChange={onChange} disabled={disabled} />;
}

export function ReadonlyProjectProfileInputField({
  proposalId,
  fieldConfig
}: {
  proposalId?: string;
  fieldConfig?: ProjectFieldConfig;
}) {
  const [selectedProject, setSelectedProject] = useState<ProjectWithMembers | null>(null);

  useEffect(() => {
    if (proposalId) {
      charmClient.getProposalProject(proposalId).then((projectWithMembers) => {
        setSelectedProject(projectWithMembers);
      });
    }
  }, [proposalId]);

  const form = useProjectForm({
    fieldConfig: fieldConfig ?? defaultProjectFieldConfig,
    projectWithMembers: selectedProject
  });

  useEffect(() => {
    if (selectedProject) {
      form.reset(convertToProjectValues(selectedProject));
    }
  }, [selectedProject?.id]);

  return (
    <Stack gap={1} width='100%'>
      <Select
        disabled
        displayEmpty
        value={selectedProject?.id}
        data-test='project-profile-select'
        renderValue={() => {
          if (!selectedProject) {
            return <Typography>No project profile selected</Typography>;
          }
          return selectedProject.name;
        }}
      />
      {selectedProject && (
        <Box p={2} mb={1} border={(theme) => `1px solid ${theme.palette.divider}`}>
          <FormProvider {...form}>
            <ProjectFormAnswers defaultRequired fieldConfig={fieldConfig} isTeamLead={false} hideTeamMembers />
          </FormProvider>
        </Box>
      )}
    </Stack>
  );
}

export function BaseProjectProfileInputField({
  formField,
  onChange,
  disabled
}: {
  onChange: (updatedValue: FormFieldValue) => void;
  formField: {
    value?: FormFieldValue;
    fieldConfig?: ProjectFieldConfig;
  };
  disabled?: boolean;
}) {
  const { user } = useUser();
  const { data } = useGetProjects();
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithMembers | null>(null);
  const isTeamLead = selectedProject?.projectMembers[0].userId === user?.id;

  useEffect(() => {
    if (formField.value && data) {
      const project = data.find((_project) => _project.id === (formField.value as { projectId: string }).projectId);
      if (project) {
        setSelectedProject(project);
      } else {
        setSelectedProject(null);
      }
    }
  }, [data, formField.value]);

  return (
    <Stack gap={1} width='100%'>
      <Select
        disabled={disabled}
        displayEmpty
        value={selectedProject?.id}
        onChange={(e) => {
          const projectId = e.target.value as string;
          if (projectId === 'ADD_PROFILE') {
            onChange({ projectId: '' });
            setShowCreateProjectForm(true);
          } else {
            onChange({ projectId });
            setShowCreateProjectForm(false);
          }
        }}
        data-test='project-profile-select'
        renderValue={(value) => {
          if (value === 'ADD_PROFILE') {
            return <Typography>Add a new project profile</Typography>;
          }
          if (!selectedProject) {
            return <Typography>Select a project profile</Typography>;
          }
          return selectedProject.name;
        }}
      >
        {data?.map((project) => (
          <MenuItem data-test={`project-option-${project.id}`} value={project.id} key={project.id}>
            <Typography>{project.name}</Typography>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem value='ADD_PROFILE' data-test='project-option-new'>
          <Stack flexDirection='row' alignItems='center' gap={0.05}>
            <MuiAddIcon fontSize='small' />
            <Typography>Add a new project profile</Typography>
          </Stack>
        </MenuItem>
      </Select>
      {(showCreateProjectForm || selectedProject) && (
        <Box p={2} mb={1} border={(theme) => `1px solid ${theme.palette.divider}`}>
          <ProjectFormAnswers
            defaultRequired
            key={selectedProject?.id ?? 'new-project'}
            fieldConfig={formField.fieldConfig as ProjectFieldConfig}
            isTeamLead={isTeamLead || showCreateProjectForm}
            hideTeamMembers
          />
        </Box>
      )}
    </Stack>
  );
}
