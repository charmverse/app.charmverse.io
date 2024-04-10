import { log } from '@charmverse/core/log';
import type { RewardsGithubRepo } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import type { SelectChangeEvent } from '@mui/material';
import { alpha, Chip, Grid, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import useSWRMutation from 'swr/mutation';
import * as yup from 'yup';

import charmClient from 'charmClient';
import {
  useConnectGithubRepository,
  useDisconnectGithubApplication,
  useGetGithubApplicationData
} from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { useGithubApp } from 'hooks/useGithubApp';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';
import type { GithubApplicationData } from 'pages/api/spaces/[id]/github';
import type { ConnectRewardGithubRepoPayload } from 'pages/api/spaces/[id]/github/repo';
import type { UpdateGithubRepoWithReward } from 'pages/api/spaces/[id]/github/repo/[repoId]';

export const schema = yup.object({
  repositoryId: yup.string().required(),
  rewardTemplateId: yup.string().uuid().required(),
  repositoryName: yup.string().required(),
  rewardAuthorId: yup.string().uuid().required(),
  repositoryLabels: yup.array(yup.string())
});

const formValueOptions = {
  shouldDirty: true,
  shouldTouch: true,
  shouldValidate: true
};

function ConnectedGithubAppSection({
  installationId,
  spaceId,
  repositories,
  rewardRepo,
  githubAppName
}: {
  spaceId: string;
  installationId: string;
  rewardRepo: RewardsGithubRepo | null;
  repositories: GithubApplicationData['repositories'];
  githubAppName: string;
}) {
  const { trigger: disconnectGithubApplication, isMutating: isDisconnectingGithubApplication } =
    useDisconnectGithubApplication(spaceId);
  const { mutate } = useGetGithubApplicationData(spaceId);
  const { showMessage } = useSnackbar();
  const { trigger: connectGithubRepository, isMutating: isConnectingGithubRepository } =
    useConnectGithubRepository(spaceId);
  const { templates, isLoading: isLoadingRewardTemplates } = useRewardTemplates();
  const { membersRecord } = useMembers();
  const { trigger: updateGithubRepoWithReward, isMutating: isUpdatingGithubRepoWithReward } = useSWRMutation(
    rewardRepo ? `spaces/${spaceId}/github/repo/${rewardRepo.id}` : null,
    (_url, { arg }: Readonly<{ arg: UpdateGithubRepoWithReward }>) =>
      charmClient.spaces.updateGithubRewardsRepo({
        repoId: rewardRepo?.id as string,
        spaceId,
        payload: arg
      })
  );

  async function handleDisconnect() {
    try {
      await disconnectGithubApplication();
      showMessage('Github application disconnected', 'success');
      mutate(() => undefined, {
        revalidate: false
      });
    } catch (err) {
      showMessage('Failed to disconnect Github application', 'error');
      log.error('Failed to disconnect Github application', {
        installationId,
        spaceId
      });
    }
  }

  const { setValue, watch, getValues, formState } = useForm({
    defaultValues: rewardRepo ?? {
      repositoryId: '',
      rewardTemplateId: '',
      repositoryName: '',
      rewardAuthorId: '',
      repositoryLabels: []
    },
    reValidateMode: 'onChange',
    resolver: yupResolver(schema)
  });

  const repositoryId = watch('repositoryId');
  const rewardTemplateId = watch('rewardTemplateId');
  const rewardAuthorId = watch('rewardAuthorId');
  const repositoryLabels = watch('repositoryLabels');

  async function handleChangeRepo(event: SelectChangeEvent<string>) {
    const repoId = event.target.value;
    const repository = repositories.find((repo) => repo.id.toString() === repoId);
    if (!repository) {
      return;
    }

    setValue('repositoryId', repoId, formValueOptions);
    setValue('repositoryName', repository.name, formValueOptions);
  }

  const disabled =
    isConnectingGithubRepository ||
    isDisconnectingGithubApplication ||
    isLoadingRewardTemplates ||
    isUpdatingGithubRepoWithReward;

  async function handleConnectGithubRepository() {
    if (!formState.isValid) {
      return;
    }

    const connectGithubPayload = getValues();

    try {
      if (rewardRepo === null) {
        await connectGithubRepository(connectGithubPayload as ConnectRewardGithubRepoPayload);
      } else {
        await updateGithubRepoWithReward(connectGithubPayload);
      }
      showMessage('Github repository connected', 'success');
      mutate();
    } catch (err) {
      showMessage('Failed to connect Github repository', 'error');
      log.error('Failed to connect Github repository', {
        installationId,
        spaceId,
        rewardTemplateId: connectGithubPayload.rewardTemplateId,
        repositoryId: connectGithubPayload.repositoryId
      });
    }
  }

  const selectedRepository = repositories.find((repo) => repo.id.toString() === repositoryId);

  return (
    <Grid container direction='row' gap={1} justifyContent='space-between' alignItems='center'>
      <Grid item xs={12}>
        <Stack gap={2}>
          <Typography>
            Connected to <strong>{githubAppName}</strong>
          </Typography>
          <Stack>
            <FieldLabel variant='subtitle1'>Repository</FieldLabel>
            <Select
              disabled={disabled}
              displayEmpty
              renderValue={(repoId) => {
                const repo = repositories.find((repository) => repository.id.toString() === repoId);
                if (repo) {
                  return <Typography>{repo.name}</Typography>;
                }

                return <Typography color='secondary'>Select a github repo</Typography>;
              }}
              onChange={handleChangeRepo}
              placeholder='Select a repository'
              value={repositoryId ?? ''}
            >
              {repositories.map((repository) => (
                <MenuItem key={repository.id} value={repository.id.toString()}>
                  <Typography>{repository.name}</Typography>
                </MenuItem>
              ))}
            </Select>
          </Stack>
          <Stack>
            <FieldLabel variant='subtitle1'>Labels</FieldLabel>
            <Select
              disabled={disabled}
              displayEmpty
              renderValue={(labels) => {
                return (
                  <Stack direction='row' gap={1}>
                    {labels.map((label) => (
                      <Chip size='small' key={label} label={label} />
                    ))}
                  </Stack>
                );
              }}
              onChange={(e) => {
                setValue('repositoryLabels', e.target.value as string[], formValueOptions);
              }}
              placeholder='Select labels'
              value={repositoryLabels}
              multiple
            >
              {selectedRepository?.labels.map((label) => (
                <MenuItem key={label.name} value={label.name.toString()}>
                  <Chip
                    size='small'
                    label={label.name}
                    sx={{
                      border: `1px solid #${label.color}`,
                      backgroundColor: alpha(`#${label.color}`, 0.1)
                    }}
                  />
                </MenuItem>
              ))}
            </Select>
          </Stack>
          <Stack>
            <FieldLabel variant='subtitle1'>Reward Template</FieldLabel>
            <Select
              disabled={disabled}
              displayEmpty
              onChange={(e) => {
                setValue('rewardTemplateId', e.target.value, formValueOptions);
              }}
              renderValue={(templateId) => {
                const template = templates?.find((tpl) => tpl.page.id === templateId);
                if (template) {
                  return <Typography>{template.page.title}</Typography>;
                }

                return <Typography color='secondary'>Select a reward template</Typography>;
              }}
              placeholder='Select a reward template'
              value={rewardTemplateId ?? ''}
            >
              {templates?.map((template) => (
                <MenuItem key={template.page.id} value={template.page.id}>
                  <Typography>{template.page.title}</Typography>
                </MenuItem>
              ))}
            </Select>
          </Stack>
          <Stack>
            <FieldLabel variant='subtitle1'>Reward Author</FieldLabel>
            <InputSearchMemberMultiple
              onChange={(id: string[]) => {
                setValue('rewardAuthorId', id[0], formValueOptions);
              }}
              disableClearable
              defaultValue={rewardRepo ? [rewardAuthorId] : undefined}
              disableCloseOnSelect
              filterSelectedOptions
              placeholder={!rewardAuthorId ? 'Search for a person...' : ''}
            />
          </Stack>
          <Stack flexDirection='row' gap={1}>
            <Button
              sx={{
                width: 'fit-content'
              }}
              variant='contained'
              color='primary'
              loading={isConnectingGithubRepository || isUpdatingGithubRepoWithReward}
              disabled={!formState.isValid || disabled || !formState.isDirty}
              disabledTooltip={!formState.isValid ? 'Select a reward template and repository' : undefined}
              onClick={handleConnectGithubRepository}
            >
              Save
            </Button>
            <Button
              sx={{
                width: 'fit-content'
              }}
              variant='outlined'
              color='error'
              loading={isDisconnectingGithubApplication}
              disabled={disabled}
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </Stack>
        </Stack>
      </Grid>
    </Grid>
  );
}

export function ConnectGithubApp({ spaceId, spaceDomain }: { spaceId: string; spaceDomain: string }) {
  const isAdmin = useIsAdmin();
  const { data, isLoading: isLoadingGithubApplicationData } = useGetGithubApplicationData(spaceId);
  const { loading } = useGithubApp();

  return (
    <Grid container direction='row' gap={1} justifyContent='space-between' alignItems='center'>
      <Grid item>
        <Typography variant='body2'>Connect your space to Github to sync rewards and issues.</Typography>
      </Grid>
      {isAdmin &&
        (!data ? (
          <Grid item>
            <Button
              loading={loading || isLoadingGithubApplicationData}
              disabledTooltip={loading ? 'Connecting with CharmVerse Github App' : undefined}
              external
              href={`https://github.com/apps/dev-charmverse-integration/installations/new?state=${encodeURIComponent(
                JSON.stringify({
                  redirect: `${window?.location.origin}/${spaceDomain as string}`
                })
              )}`}
            >
              Connect
            </Button>
          </Grid>
        ) : (
          <ConnectedGithubAppSection
            installationId={data.spaceGithubConnection.installationId}
            spaceId={spaceId}
            repositories={data.repositories}
            rewardRepo={data.spaceGithubConnection.rewardsRepo}
            githubAppName={data.spaceGithubConnection.name}
          />
        ))}
    </Grid>
  );
}
