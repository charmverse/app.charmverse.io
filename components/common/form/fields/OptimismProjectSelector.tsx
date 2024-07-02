import LaunchIcon from '@mui/icons-material/Launch';
import { ListItemText, MenuItem, Select, Stack, Typography } from '@mui/material';

import { useGetOpProject, useGetOpProjects } from 'charmClient/hooks/optimism';
import { Avatar } from 'components/common/Avatar';
import Link from 'components/common/Link';
import MultiTabs from 'components/common/MultiTabs';
import { WarpcastLogin } from 'components/login/components/WarpcastLogin';
import { useUser } from 'hooks/useUser';
import type { OpProjectFieldValue } from 'lib/forms/interfaces';
import { isValidUrl } from 'lib/utils/isValidUrl';
import type { OptimismProjectAttestationContent } from 'pages/api/optimism/projects';

import type { ControlFieldProps, FieldProps } from '../interfaces';

import { FieldWrapper } from './FieldWrapper';

type Props = Omit<ControlFieldProps, 'value'> &
  FieldProps & {
    value?: OpProjectFieldValue;
  };

function OptimismProjectFields({
  value,
  label
}: {
  label: string;
  value: number | string | string[] | null | undefined;
}) {
  if (!value) {
    return null;
  }

  return (
    <Stack>
      <Typography fontWeight='bold' variant='subtitle2'>
        {label}
      </Typography>
      {Array.isArray(value) ? (
        <Stack gap={1}>
          {value.map((v) =>
            isValidUrl(v) || v.startsWith('http') ? (
              <Link external key={v} href={v} target='_blank'>
                {v}
              </Link>
            ) : (
              <Typography key={v}>{v}</Typography>
            )
          )}
        </Stack>
      ) : typeof value === 'string' ? (
        isValidUrl(value) || value.startsWith('http') ? (
          <Link external href={value} target='_blank'>
            {value}
          </Link>
        ) : (
          <Typography>{value}</Typography>
        )
      ) : (
        <Typography>{value}</Typography>
      )}
    </Stack>
  );
}

function OptimismProjectDisplay({ project }: { project: OptimismProjectAttestationContent }) {
  const {
    metadata: {
      socialLinks,
      contracts,
      projectAvatarUrl,
      projectCoverImageUrl,
      description,
      category,
      github,
      osoSlug,
      grantsAndFunding
    },
    attestationId
  } = project;

  return (
    <Stack mt={1} bgcolor={(theme) => theme.palette.background.paper} gap={1.5}>
      {projectCoverImageUrl && isValidUrl(projectCoverImageUrl) && (
        <img
          src={projectCoverImageUrl}
          alt={project.name}
          style={{ width: '100%', height: '150px', objectFit: 'cover' }}
        />
      )}
      <Stack gap={1} direction='row' alignItems='center' p={1.5} pb={0}>
        <Avatar
          avatar={isValidUrl(projectAvatarUrl) ? projectAvatarUrl : undefined}
          name={project.name}
          size='medium'
          variant='rounded'
        />
        <Typography variant='h6'>{project.name}</Typography>
      </Stack>

      <MultiTabs
        tabs={[
          [
            'Overview',
            <Stack gap={1.5} key='overview'>
              <OptimismProjectFields label='Project description' value={description} />
              <OptimismProjectFields label='Project attestation id' value={attestationId} />
              <OptimismProjectFields label='Categories' value={category} />
              <OptimismProjectFields label='Open Source Observer' value={osoSlug} />
              <OptimismProjectFields label='Repositories' value={github} />
            </Stack>
          ],
          [
            'Social',
            <Stack gap={1.5} key='social'>
              <OptimismProjectFields label='Farcaster' value={socialLinks.farcaster} />
              <OptimismProjectFields label='Twitter' value={socialLinks.twitter} />
              <OptimismProjectFields label='Website' value={socialLinks.website} />
              <OptimismProjectFields label='Mirror' value={socialLinks.mirror} />
            </Stack>
          ],
          [
            'Contracts',
            <Stack gap={1.5} key='contracts'>
              {contracts.map((contract, index) => (
                <Stack key={contract.address} gap={1} mt={index !== 0 ? 2 : 0}>
                  <OptimismProjectFields label='Address' value={contract.address} />
                  <OptimismProjectFields label='Chain id' value={contract.chainId} />
                  <OptimismProjectFields label='Deployer' value={contract.deployerAddress} />
                  <OptimismProjectFields label='Transaction id' value={contract.deploymentTxHash} />
                </Stack>
              ))}
            </Stack>
          ],
          [
            'Funding',
            <Stack gap={1} key='funding'>
              <Typography fontWeight='bold'>Venture</Typography>
              {grantsAndFunding.ventureFunding.length === 0
                ? 'N/A'
                : grantsAndFunding.ventureFunding.map((funding) => (
                    <Stack key={funding.amount} gap={1}>
                      <OptimismProjectFields label='Amount' value={funding.amount} />
                      <OptimismProjectFields label='Year' value={funding.year} />
                      <OptimismProjectFields label='Details' value={funding.details} />
                    </Stack>
                  ))}
              <Typography fontWeight='bold' mt={2}>
                Grants
              </Typography>
              {grantsAndFunding.grants.length === 0
                ? 'N/A'
                : grantsAndFunding.grants.map((funding) => (
                    <Stack key={funding.amount} gap={1}>
                      <OptimismProjectFields label='Name' value={funding.grant} />
                      <OptimismProjectFields label='Amount' value={funding.amount} />
                      <OptimismProjectFields label='Date' value={funding.date} />
                      <OptimismProjectFields label='Link' value={funding.link} />
                      <OptimismProjectFields label='Details' value={funding.details} />
                    </Stack>
                  ))}
              <Typography fontWeight='bold' mt={2}>
                Revenue
              </Typography>
              {grantsAndFunding.revenue.length === 0
                ? 'N/A'
                : grantsAndFunding.revenue.map((funding) => (
                    <Stack key={funding.amount} gap={1}>
                      <OptimismProjectFields label='Amount' value={funding.amount} />
                      <OptimismProjectFields label='Details' value={funding.details} />
                    </Stack>
                  ))}
            </Stack>
          ]
        ]}
      />
    </Stack>
  );
}

export function OptimismProjectSelector({ value, disabled, ...props }: Props) {
  const { user } = useUser();
  const hasFarcasterAccount = !!user?.farcasterUser?.fid;

  const { data: projects = [] } = useGetOpProjects(hasFarcasterAccount);

  const selectedProject = projects.find((project) => project.attestationId === value?.attestationId);

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
            value={selectedProject?.attestationId ?? ''}
            disabled={disabled}
            onChange={(e) => {
              const projectId = e.target.value;
              const newProject =
                projectId !== 'add-new-project'
                  ? projects.find((project) => project.attestationId === projectId)
                  : null;
              if (newProject) {
                props.onChange?.({
                  projectTitle: newProject.name,
                  attestationId: newProject.attestationId
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
              <MenuItem
                key={project.attestationId}
                value={project.attestationId}
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
                  secondary={project.metadata.description}
                />
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
        value={project?.attestationId ?? ''}
        disabled
        fullWidth
        renderValue={() =>
          !project ? <Typography color='textSecondary'>Select a project</Typography> : project?.name ?? ''
        }
      >
        {project && (
          <MenuItem key={project.attestationId} value={project.attestationId}>
            <Typography>{project.name}</Typography>
          </MenuItem>
        )}
      </Select>
      {project && <OptimismProjectDisplay project={project} />}
    </FieldWrapper>
  );
}
