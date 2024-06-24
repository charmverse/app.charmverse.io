import LaunchIcon from '@mui/icons-material/Launch';
import { FormLabel, MenuItem, Select, Stack, Typography } from '@mui/material';

import { useGetOpProject, useGetOpProjects } from 'charmClient/hooks/optimism';
import { Avatar } from 'components/common/Avatar';
import Link from 'components/common/Link';
import { WarpcastLogin } from 'components/login/components/WarpcastLogin';
import { useUser } from 'hooks/useUser';
import type { OpProjectFieldValue } from 'lib/forms/interfaces';
import type { OPProjectData } from 'lib/optimism/getOpProjects';

import type { ControlFieldProps, FieldProps } from '../interfaces';

import { FieldWrapper } from './FieldWrapper';

type Props = Omit<ControlFieldProps, 'value'> &
  FieldProps & {
    value?: OpProjectFieldValue;
  };

function OptimismProjectDisplay({ project }: { project: OPProjectData }) {
  return (
    <Stack mt={1} bgcolor={(theme) => theme.palette.background.paper} gap={1} p={1}>
      <Stack gap={1} direction='row' alignItems='center'>
        <Avatar avatar={project.coverImageUrl} name={project.name} size='large' />
        <Typography variant='h6'>{project.name}</Typography>
      </Stack>
      <Stack>
        <FormLabel>Project description</FormLabel>
        <Typography>{project.description}</Typography>
      </Stack>
      <Stack>
        <FormLabel>Project Attestation id</FormLabel>
        <Typography>{project.attestationUid}</Typography>
      </Stack>
      <Stack>
        <FormLabel>External link</FormLabel>
        <Typography>{project.externalLink}</Typography>
      </Stack>
      <Stack>
        <FormLabel>Repositories</FormLabel>
        {project.repositories.map((repository) => (
          <Link external key={repository} href={repository} target='_blank'>
            {repository}
          </Link>
        ))}
      </Stack>
      <Stack>
        <FormLabel>Farcaster</FormLabel>
        <Typography>{project.socialLinks.farcaster}</Typography>
      </Stack>
      <Stack>
        <FormLabel>X</FormLabel>
        <Typography>{project.socialLinks.twitter}</Typography>
      </Stack>
      <Stack>
        <FormLabel>Website</FormLabel>
        <Link external href={project.socialLinks.website} target='_blank'>
          <Typography>{project.socialLinks.website}</Typography>
        </Link>
      </Stack>
    </Stack>
  );
}

export function OptimismProjectSelector({ value, disabled, ...props }: Props) {
  const { user } = useUser();
  const hasFarcasterAccount = !!user?.farcasterUser?.fid;

  const { data: projects = [] } = useGetOpProjects(hasFarcasterAccount);

  const selectedProject = projects.find((project) => project.attestationUid === value?.attestationId);

  if (disabled) {
    return <OptimismProjectSelectorReadOnly value={value} {...props} />;
  }

  return (
    <FieldWrapper {...props}>
      {!disabled && !hasFarcasterAccount ? (
        <WarpcastLogin size='small' type='connect' label='Connect your farcaster account' />
      ) : (
        <>
          <Select<string>
            displayEmpty
            value={selectedProject?.attestationUid ?? ''}
            disabled={disabled}
            onChange={(e) => {
              const projectId = e.target.value;
              const newProject =
                projectId !== 'add-new-project'
                  ? projects.find((project) => project.attestationUid === projectId)
                  : null;
              if (newProject) {
                props.onChange?.({
                  projectTitle: newProject.name,
                  attestationId: newProject.attestationUid
                });
              }
            }}
            fullWidth
            renderValue={(selectedValue) => {
              if (selectedValue === '') {
                return <Typography color='textSecondary'>Select a project</Typography>;
              }
              return selectedProject?.name ?? '';
            }}
          >
            {projects.map((project) => (
              <MenuItem key={project.attestationUid} value={project.attestationUid}>
                <Typography>{project.name}</Typography>
              </MenuItem>
            ))}
            <Link target='_blank' href='https://retrofunding.optimism.io' external>
              <MenuItem value='add-new-project'>
                <Stack direction='row' gap={1} alignItems='center'>
                  <Typography color='primary'>Create new OP project</Typography>
                  <LaunchIcon fontSize='small' />
                </Stack>
              </MenuItem>
            </Link>
          </Select>
          {selectedProject && <OptimismProjectDisplay project={selectedProject} />}
        </>
      )}
    </FieldWrapper>
  );
}

function OptimismProjectSelectorReadOnly({ value, ...props }: Props) {
  const { data: project } = useGetOpProject(value?.attestationId);
  return (
    <FieldWrapper {...props}>
      <Select<string>
        displayEmpty
        value={project?.attestationUid ?? ''}
        disabled
        fullWidth
        renderValue={() =>
          !project ? <Typography color='textSecondary'>Select a project</Typography> : project?.name ?? ''
        }
      >
        {project && (
          <MenuItem key={project.attestationUid} value={project.attestationUid}>
            <Typography>{project.name}</Typography>
          </MenuItem>
        )}
      </Select>
      {project && <OptimismProjectDisplay project={project} />}
    </FieldWrapper>
  );
}
