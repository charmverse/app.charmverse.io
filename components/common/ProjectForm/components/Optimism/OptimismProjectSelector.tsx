import { ListItemText, MenuItem, Select, Typography } from '@mui/material';
import { useState } from 'react';

import { useCreateOptimismProject, useGetOpProject, useGetOpProjects } from 'charmClient/hooks/optimism';
import { WarpcastLogin } from 'components/login/components/WarpcastLogin';
import { useUser } from 'hooks/useUser';
import type { OpProjectFieldValue } from 'lib/forms/interfaces';
import { fancyTrim } from 'lib/utils/strings';

import { FieldWrapper } from '../../../form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from '../../../form/interfaces';

import { OptimismProjectDisplay } from './OptimismProjectDisplay';
import { OptimismProjectForm } from './OptimismProjectForm';
import type { OptimismProjectFormValues } from './optimismProjectFormValues';

type Props = Omit<ControlFieldProps, 'value'> &
  FieldProps & {
    value?: OpProjectFieldValue;
  };

export function OptimismProjectSelector({ value, disabled, ...props }: Props) {
  const { user } = useUser();
  const hasFarcasterAccount = !!user?.farcasterUser?.fid;
  const [creatingOpProject, setCreatingOpProject] = useState(false);
  const { mutate, data: projects = [] } = useGetOpProjects(hasFarcasterAccount);

  const selectedProject = projects.find((project) => project.projectRefUID === value?.projectRefUID);
  const { trigger: createProject, isMutating } = useCreateOptimismProject();

  if (disabled) {
    return <OptimismProjectSelectorReadOnly value={value} {...props} />;
  }

  function onSubmit(values: OptimismProjectFormValues) {
    createProject({
      ...values,
      // For some reason websites and farcasterValues both are [null] need to find out why
      farcasterValues: values.farcasterValues?.filter((farcasterValue) => farcasterValue) ?? [],
      websites: values.websites?.filter((website) => website) ?? []
    }).then((projectInfo) =>
      mutate().then(() => {
        props.onChange?.({
          projectTitle: projectInfo.title,
          projectRefUID: projectInfo.projectRefUID
        });
        setCreatingOpProject(false);
      })
    );
  }

  return (
    <FieldWrapper {...props}>
      {!disabled && !hasFarcasterAccount ? (
        <WarpcastLogin size='small' type='connect' label='Connect your farcaster account' />
      ) : (
        <>
          <Select<string>
            displayEmpty
            value={selectedProject?.projectRefUID ?? ''}
            disabled={disabled}
            onChange={(e) => {
              const projectId = e.target.value;
              if (projectId === 'add-new-project') {
                setCreatingOpProject(true);
              } else if (projectId === 'remove-project') {
                props.onChange?.({
                  projectTitle: '',
                  projectRefUID: ''
                });
              } else {
                const newProject = projects.find((project) => project.projectRefUID === projectId);
                if (newProject) {
                  props.onChange?.({
                    projectTitle: newProject.name,
                    projectRefUID: newProject.projectRefUID
                  });
                }
              }
            }}
            fullWidth
            renderValue={(selectedValue) => {
              if (creatingOpProject || selectedValue === 'add-new-project') {
                return <Typography color='textSecondary'>New project</Typography>;
              } else if (selectedValue === '') {
                return <Typography color='textSecondary'>Select a project</Typography>;
              }
              return selectedProject?.name ?? '';
            }}
          >
            {projects.map((project) => (
              <MenuItem
                key={project.projectRefUID}
                value={project.projectRefUID}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  alignItems: 'flex-start',
                  maxWidth: 700,
                  mb: 1
                }}
              >
                <Typography variant='body1'>{project.name}</Typography>
                <ListItemText
                  sx={{
                    textWrap: 'wrap',
                    textOverflow: 'ellipsis'
                  }}
                  secondary={fancyTrim(project.metadata.description, 150)}
                />
              </MenuItem>
            ))}
            <MenuItem value='add-new-project' sx={{ mb: 1 }}>
              <Typography>Create new OP project</Typography>
            </MenuItem>
            <MenuItem value='remove-project' sx={{ mb: 1 }}>
              <Typography>Remove OP project</Typography>
            </MenuItem>
          </Select>
          {creatingOpProject ? (
            <OptimismProjectForm
              onSubmit={onSubmit}
              submitButtonText='Create'
              isMutating={isMutating}
              onCancel={() => setCreatingOpProject(false)}
            />
          ) : selectedProject ? (
            <OptimismProjectDisplay project={selectedProject} />
          ) : null}
        </>
      )}
    </FieldWrapper>
  );
}

function OptimismProjectSelectorReadOnly({ value, ...props }: Props) {
  const { data: project } = useGetOpProject(value?.projectRefUID);
  return (
    <FieldWrapper {...props}>
      <Select<string>
        displayEmpty
        value={project?.projectRefUID ?? ''}
        disabled
        fullWidth
        renderValue={() =>
          !project ? <Typography color='textSecondary'>Select a project</Typography> : project?.name ?? ''
        }
      >
        {project && (
          <MenuItem key={project.projectRefUID} value={project.projectRefUID}>
            <Typography>{project.name}</Typography>
          </MenuItem>
        )}
      </Select>
      {project && <OptimismProjectDisplay readOnly project={project} />}
    </FieldWrapper>
  );
}
