import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Divider, Stack, Typography } from '@mui/material';
import { replaceUrl } from '@packages/utils/url';
import { useState } from 'react';

import { useEditOptimismProject, useGetOpProjects } from 'charmClient/hooks/optimism';
import { Avatar } from 'components/common/Avatar';
import { Button } from 'components/common/Button';
import Link from 'components/common/Link';
import MultiTabs from 'components/common/MultiTabs';
import { useUser } from 'hooks/useUser';
import type { OptimismProjectAttestationContent } from 'lib/optimism/getOpProjectsByFarcasterId';
import type {
  ProjectCategory as OptimismProjectCategory,
  FormValues as OptimismProjectFormValues
} from 'lib/optimism/projectSchema';
import { isValidUrl } from 'lib/utils/isValidUrl';

import { FarcasterCard, OptimismProjectForm } from './OptimismProjectForm';

function OptimismProjectFields({
  value,
  label
}: {
  label: string;
  value: number | string | string[] | null | undefined;
}) {
  if (Array.isArray(value) ? value.length === 0 : !value) {
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
                <Typography
                  sx={{
                    overflowWrap: 'break-word'
                  }}
                >
                  {v}
                </Typography>
              </Link>
            ) : (
              <Typography
                key={v}
                sx={{
                  overflowWrap: 'break-word'
                }}
              >
                {v}
              </Typography>
            )
          )}
        </Stack>
      ) : typeof value === 'string' ? (
        isValidUrl(value) || value.startsWith('http') ? (
          <Link external href={value} target='_blank'>
            <Typography
              sx={{
                overflowWrap: 'break-word'
              }}
            >
              {value}
            </Typography>
          </Link>
        ) : (
          <Typography
            sx={{
              overflowWrap: 'break-word'
            }}
          >
            {value}
          </Typography>
        )
      ) : (
        <Typography
          sx={{
            overflowWrap: 'break-word'
          }}
        >
          {value}
        </Typography>
      )}
    </Stack>
  );
}

export function OptimismProjectDisplay({
  project,
  readOnly
}: {
  readOnly?: boolean;
  project: OptimismProjectAttestationContent;
}) {
  const { user } = useUser();
  const { mutate } = useGetOpProjects();
  const [isEditing, setIsEditing] = useState(false);
  const { trigger: editProject, isMutating } = useEditOptimismProject(project.projectRefUID);
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
      grantsAndFunding,
      team
    },
    farcasterIds,
    teamMembers,
    metadataAttestationUID,
    projectRefUID
  } = project;

  const canEdit = farcasterIds.find((farcasterId) => farcasterId === user?.farcasterUser?.fid);

  function onSubmit(values: OptimismProjectFormValues) {
    editProject({
      ...values,
      farcasterValues: values.farcasterValues?.filter((farcasterValue) => farcasterValue) ?? [],
      websites: values.websites?.filter((website) => website) ?? []
    }).then(() =>
      mutate().then(() => {
        setIsEditing(false);
      })
    );
  }

  if (isEditing) {
    return (
      <OptimismProjectForm
        optimismValues={{
          name: project.name,
          avatar: projectAvatarUrl,
          optimismCategory: (category || null) as OptimismProjectCategory,
          description,
          coverImage: projectCoverImageUrl,
          github: github ? github[0] : '',
          mirror: socialLinks.mirror ?? '',
          farcasterValues: socialLinks.farcaster,
          twitter: socialLinks.twitter,
          websites: socialLinks.website,
          projectMembers: team.map((farcasterId) => ({ farcasterId: parseInt(farcasterId) }))
        }}
        // skip the team lead
        initialFarcasterProfiles={teamMembers.slice(1)}
        submitButtonText='Update'
        onSubmit={onSubmit}
        isMutating={isMutating}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Stack mt={1} bgcolor={(theme) => theme.palette.background.paper} gap={1.5}>
      {projectCoverImageUrl && isValidUrl(projectCoverImageUrl) && (
        <img
          src={projectCoverImageUrl}
          alt={project.name}
          style={{ width: '100%', height: '150px', objectFit: 'cover' }}
        />
      )}
      <Stack direction='row' alignItems='center' p={1.5} pb={0} justifyContent='space-between'>
        <Stack gap={1} direction='row' alignItems='center'>
          <Avatar
            avatar={isValidUrl(projectAvatarUrl) ? projectAvatarUrl : undefined}
            name={project.name}
            size='medium'
            variant='rounded'
          />
          <Typography variant='h6'>{project.name}</Typography>
        </Stack>
        {!readOnly && (
          <Button
            onClick={() => setIsEditing(true)}
            startIcon={<EditOutlinedIcon fontSize='small' />}
            variant='outlined'
            color='secondary'
            disabledTooltip={!canEdit ? 'You do not have permission to edit this project' : undefined}
          >
            Edit
          </Button>
        )}
      </Stack>

      <MultiTabs
        tabs={[
          [
            'Overview',
            <Stack gap={1.5} key='overview'>
              <OptimismProjectFields label='Project description' value={description} />
              <OptimismProjectFields
                label='Project attestation'
                value={`https://optimism.easscan.org/attestation/view/${projectRefUID}`}
              />
              <OptimismProjectFields
                label='Project metadata attestation'
                value={`https://optimism.easscan.org/attestation/view/${metadataAttestationUID}`}
              />
              <OptimismProjectFields label='Categories' value={category} />
              <OptimismProjectFields label='Open Source Observer' value={osoSlug} />
              <OptimismProjectFields label='Repositories' value={github} />
            </Stack>
          ],
          [
            'Team',
            <Stack gap={1.5} key='team'>
              {project.teamMembers.map((member) => (
                <FarcasterCard key={member.fid} avatar={member.avatar} name={member.name} username={member.username} />
              ))}
            </Stack>
          ],
          [
            'Social',
            <Stack gap={1.5} key='social'>
              <OptimismProjectFields
                label='Farcaster'
                value={socialLinks.farcaster.map((farcasterValue) => replaceUrl(farcasterValue, 'warpcast.com').href)}
              />
              <OptimismProjectFields label='Twitter' value={replaceUrl(socialLinks.twitter, 'x.com').href} />
              <OptimismProjectFields label='Website' value={socialLinks.website} />
              <OptimismProjectFields
                label='Mirror'
                value={socialLinks.mirror ? replaceUrl(socialLinks.mirror, 'mirror.xyz').href : null}
              />
            </Stack>
          ],
          [
            'Contracts',
            <Stack gap={1.5} key='contracts'>
              {contracts.map((contract, index) => (
                <Stack key={contract.address} gap={1} mt={index !== 0 ? 2 : 0}>
                  <OptimismProjectFields label='Address' value={contract.address} />
                  <OptimismProjectFields label='Chain id' value={contract.chainId} />
                  <OptimismProjectFields label='Deployer address' value={contract.deployerAddress} />
                  <OptimismProjectFields label='Transaction hash' value={contract.deploymentTxHash} />
                  <Divider sx={{ mt: 2 }} />
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
