import LaunchIcon from '@mui/icons-material/Launch';
import { Divider, MenuItem, Select, Stack, Typography } from '@mui/material';

import { useGetOpProject, useGetOpProjects } from 'charmClient/hooks/optimism';
import { Avatar } from 'components/common/Avatar';
import Link from 'components/common/Link';
import MultiTabs from 'components/common/MultiTabs';
import { WarpcastLogin } from 'components/login/components/WarpcastLogin';
import { useUser } from 'hooks/useUser';
import type { OpProjectFieldValue } from 'lib/forms/interfaces';
import type { OPProjectData } from 'lib/optimism/getOpProjects';
import { isValidUrl } from 'lib/utils/isValidUrl';

import type { ControlFieldProps, FieldProps } from '../interfaces';

import { FieldWrapper } from './FieldWrapper';

type Props = Omit<ControlFieldProps, 'value'> &
  FieldProps & {
    value?: OpProjectFieldValue;
  };

function OptimismProjectFields({ value, label }: { label: string; value: string | string[] }) {
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
      ) : isValidUrl(value) || value.startsWith('http') ? (
        <Link external href={value} target='_blank'>
          {value}
        </Link>
      ) : (
        <Typography>{value}</Typography>
      )}
    </Stack>
  );
}

function OptimismProjectDisplay({ project }: { project: OPProjectData }) {
  return (
    <Stack mt={1} bgcolor={(theme) => theme.palette.background.paper} gap={1.5} p={1.5}>
      {project.coverImageUrl && isValidUrl(project.coverImageUrl) && (
        <img
          src={project.coverImageUrl}
          alt={project.name}
          style={{ width: '100%', height: '150px', objectFit: 'cover' }}
        />
      )}
      <Stack gap={1} direction='row' alignItems='center'>
        <Avatar
          avatar={isValidUrl(project.avatarUrl) ? project.avatarUrl : undefined}
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
              <OptimismProjectFields label='Project description' value={project.description} />
              <OptimismProjectFields label='Project attestation id' value={project.attestationUid} />
              <OptimismProjectFields label='Categories' value={project.categories.map((c) => c.name)} />
              <OptimismProjectFields label='External link' value={project.externalLink} />
              <OptimismProjectFields label='Repositories' value={project.repositories} />
            </Stack>
          ],
          [
            'Social',
            <Stack gap={1.5} key='social'>
              <OptimismProjectFields label='Farcaster' value={project.socialLinks.farcaster} />
              <OptimismProjectFields label='Twitter' value={project.socialLinks.twitter} />
              <OptimismProjectFields label='Website' value={project.socialLinks.website} />
              <OptimismProjectFields label='Mirror' value={project.socialLinks.mirror} />
            </Stack>
          ],
          [
            'Contracts',
            <Stack gap={1.5} key='contracts'>
              {project.deployedContracts.map((contract, index) => (
                <Stack key={contract.address} gap={1} mt={index !== 0 ? 2 : 0}>
                  <OptimismProjectFields label='Address' value={contract.address} />
                  <OptimismProjectFields label='Chain id' value={contract.chainId} />
                  <OptimismProjectFields label='Deployer' value={contract.deployer} />
                  <OptimismProjectFields label='Creation block' value={contract.creationBlock} />
                  <OptimismProjectFields label='Transaction id' value={contract.transactionId} />
                  <OptimismProjectFields label='Verification proof' value={contract.verificationProof} />
                  <OptimismProjectFields label='Open source observer slug' value={contract.openSourceObserverSlug} />
                </Stack>
              ))}
            </Stack>
          ],
          [
            'Funding',
            <Stack gap={1} key='funding'>
              <Typography fontWeight='bold'>Venture capital</Typography>
              {project.funding.ventureCapital.map((funding) => (
                <Stack key={funding.amount} gap={1}>
                  <OptimismProjectFields label='Amount' value={funding.amount} />
                  <OptimismProjectFields label='Source' value={funding.source} />
                  <OptimismProjectFields label='Date' value={funding.date} />
                  <OptimismProjectFields label='Details' value={funding.details} />
                </Stack>
              ))}
              <Typography fontWeight='bold' mt={2}>
                Grants
              </Typography>
              {project.funding.grants.map((funding) => (
                <Stack key={funding.amount} gap={1}>
                  <OptimismProjectFields label='Amount' value={funding.amount} />
                  <OptimismProjectFields label='Source' value={funding.source} />
                  <OptimismProjectFields label='Date' value={funding.date} />
                  <OptimismProjectFields label='Details' value={funding.details} />
                </Stack>
              ))}
              <Typography fontWeight='bold' mt={2}>
                Optimism grants
              </Typography>
              {project.funding.optimismGrants.map((funding) => (
                <Stack key={funding.amount} gap={1}>
                  <OptimismProjectFields label='Amount' value={funding.amount} />
                  <OptimismProjectFields label='Source' value={funding.source} />
                  <OptimismProjectFields label='Date' value={funding.date} />
                  <OptimismProjectFields label='Details' value={funding.details} />
                  <OptimismProjectFields label='Link' value={funding.link} />
                  <OptimismProjectFields label='Type' value={funding.type} />
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
