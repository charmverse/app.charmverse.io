import AddIcon from '@mui/icons-material/Add';
import { Box, Divider, Stack, Tooltip } from '@mui/material';
import { useState } from 'react';

import { useCreateProject, useGetProjects } from 'charmClient/hooks/projects';
import { Button } from 'components/common/Button';
import { defaultProjectFieldConfig, type ProjectValues, type ProjectWithMembers } from 'components/projects/interfaces';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';
import { projectMemberDefaultValues } from 'components/projects/ProjectMemberFields';

import { useGetDefaultProject } from './hooks/useGetDefaultProject';
import { useProjectForm } from './hooks/useProjectForm';

export function CreateProjectForm({
  onCancel,
  project: _project = null,
  onSave
}: {
  onSave?: (project: ProjectWithMembers) => void;
  onCancel?: VoidFunction;
  project?: ProjectValues | null;
}) {
  const defaultProject = useGetDefaultProject();
  const [project, setProject] = useState<ProjectValues | null>(_project);
  const { trigger: createProject, isMutating } = useCreateProject();

  const { control, isValid } = useProjectForm({
    defaultValues: project ?? undefined,
    fieldConfig: defaultProjectFieldConfig,
    defaultRequired: false
  });

  const { mutate } = useGetProjects();

  async function saveProject() {
    if (!project) {
      return;
    }

    try {
      const createdProjectWithMember = await createProject(project);
      onSave?.(createdProjectWithMember);
      setProject(null);
      mutate(
        (cachedData) => {
          if (!cachedData) {
            return cachedData;
          }

          return [...cachedData, createdProjectWithMember];
        },
        {
          revalidate: false
        }
      );
    } catch (err) {
      //
    }
  }

  return (
    <>
      {project && (
        <Box mb={3}>
          <Divider
            sx={{
              my: 1
            }}
          />
          <ProjectFormAnswers
            defaultRequired={false}
            fieldConfig={defaultProjectFieldConfig}
            onChange={setProject}
            isTeamLead
            control={control}
            onMemberRemove={(memberIndex) => {
              setProject({
                ...project,
                projectMembers: project.projectMembers.filter((_, index) => index !== memberIndex)
              });
            }}
            onMemberAdd={() => {
              setProject({
                ...project,
                projectMembers: [...project.projectMembers, projectMemberDefaultValues]
              });
            }}
            values={project}
          />
        </Box>
      )}

      {project ? (
        <Stack gap={1} flexDirection='row'>
          <Button
            disabledTooltip={!isValid ? 'Please fill out all required fields' : ''}
            disabled={isMutating || !isValid}
            onClick={saveProject}
          >
            Save
          </Button>
          <Button
            disabled={isMutating}
            variant='outlined'
            color='error'
            onClick={() => {
              setProject(null);
              onCancel?.();
            }}
          >
            Cancel
          </Button>
        </Stack>
      ) : (
        <Button
          disabled={isMutating}
          onClick={() => {
            setProject(defaultProject);
          }}
          startIcon={<AddIcon fontSize='small' />}
        >
          Add a project
        </Button>
      )}
    </>
  );
}
