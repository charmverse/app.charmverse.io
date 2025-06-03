import { log } from '@charmverse/core/log';
import type { RewardsGithubRepo } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import type { SelectChangeEvent } from '@mui/material';
import { Chip, Grid, Link, MenuItem, Select, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
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
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { GithubApplicationData } from 'pages/api/spaces/[id]/github';
import type { ConnectRewardGithubRepoPayload } from 'pages/api/spaces/[id]/github/repo';
import type { UpdateGithubRepoWithReward } from 'pages/api/spaces/[id]/github/repo/[repoId]';

export const schema = yup.object({
  repositoryId: yup.string().required(),
  rewardTemplateId: yup.string().uuid().nullable(),
  repositoryName: yup.string().required(),
  rewardAuthorId: yup.string().uuid().required(),
  repositoryLabels: yup.array(yup.string())
});

const formFieldOptions = {
  shouldDirty: true,
  shouldTouch: true,
  shouldValidate: true
};

export function GithubSettingsForm({
  installationId,
  spaceId,
  repositories,
  rewardRepo,
  githubAppName,
  onSave,
  hideDisconnect = false
}: {
  onSave?: VoidFunction;
  spaceId: string;
  installationId: string;
  rewardRepo: RewardsGithubRepo | null;
  repositories: GithubApplicationData['repositories'];
  githubAppName: string;
  hideDisconnect?: boolean;
}) {
  const { getFeatureTitle } = useSpaceFeatures();
  const disconnectGithubModalState = usePopupState({ variant: 'popover', popupId: 'disconnect-github' });
  const isAdmin = useIsAdmin();
  const { trigger: disconnectGithubApplication, isMutating: isDisconnectingGithubApplication } =
    useDisconnectGithubApplication(spaceId);
  const { mutate } = useGetGithubApplicationData(spaceId);
  const { showMessage } = useSnackbar();
  const { trigger: connectGithubRepository, isMutating: isConnectingGithubRepository } =
    useConnectGithubRepository(spaceId);
  const { templates, isLoading: isLoadingRewardTemplates } = useRewardTemplates();
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

  const { setValue, watch, formState, handleSubmit, reset } = useForm({
    defaultValues: {
      repositoryId: rewardRepo?.repositoryId ?? '',
      rewardTemplateId: rewardRepo?.rewardTemplateId ?? null,
      repositoryName: rewardRepo?.repositoryName ?? '',
      rewardAuthorId: rewardRepo?.rewardAuthorId ?? '',
      repositoryLabels: rewardRepo?.repositoryLabels ?? []
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

    setValue('repositoryId', repoId, formFieldOptions);
    setValue('repositoryName', repository.name, formFieldOptions);
  }

  const disabled =
    isConnectingGithubRepository ||
    isDisconnectingGithubApplication ||
    isLoadingRewardTemplates ||
    isUpdatingGithubRepoWithReward ||
    !isAdmin;

  function handleConnectGithubRepository() {
    handleSubmit(
      async (connectGithubPayload) => {
        let githubRepoWithReward: RewardsGithubRepo;
        if (rewardRepo === null) {
          githubRepoWithReward = await connectGithubRepository(connectGithubPayload as ConnectRewardGithubRepoPayload);
          showMessage('Github repository connected', 'success');
        } else {
          githubRepoWithReward = await updateGithubRepoWithReward(connectGithubPayload as UpdateGithubRepoWithReward);
          showMessage('Repository connection updated', 'success');
        }
        reset(githubRepoWithReward, {
          keepDirty: false,
          keepTouched: false,
          keepErrors: false
        });
        mutate();
        onSave?.();
      },
      (connectGithubPayload) => {
        showMessage('Failed to connect Github repository', 'error');
        log.error('Failed to connect Github repository', {
          installationId,
          spaceId,
          rewardTemplateId: connectGithubPayload.rewardTemplateId,
          repositoryId: connectGithubPayload.repositoryId
        });
      }
    )();
  }

  const selectedRepository = repositories.find((repo) => repo.id.toString() === repositoryId);

  return (
    <Grid container direction='row' gap={1} justifyContent='space-between' alignItems='center'>
      <Grid size={12}>
        <Stack gap={2}>
          <Typography>
            Connected to <strong>{githubAppName}</strong>
          </Typography>
          <Stack gap={2}>
            <FieldWrapper label='Repository Name' required>
              <Typography variant='body2' fontWeight={500} mb={1} color='secondary'>
                Can't find your repository?{' '}
                <Link target='_blank' href={`https://github.com/settings/installations/${installationId}`}>
                  Add it
                </Link>{' '}
                to your installation configuration under Repository access.
              </Typography>
              <Select
                fullWidth
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
            </FieldWrapper>
          </Stack>
          <FieldWrapper label='Repository Labels'>
            <Typography variant='body2' fontWeight={500} mb={1} color='secondary'>
              Only sync issues with these labels. Leave empty to sync all issues.
            </Typography>
            <Select
              fullWidth
              disabled={disabled}
              displayEmpty
              renderValue={(labels) => {
                if (labels.length === 0) {
                  return <Typography color='secondary'>Select labels</Typography>;
                }
                return (
                  <Stack direction='row' gap={1}>
                    {labels.map((label) => (
                      <Chip size='small' key={label} label={label} />
                    ))}
                  </Stack>
                );
              }}
              onChange={(e) => {
                setValue('repositoryLabels', e.target.value as string[], formFieldOptions);
              }}
              placeholder='Select labels'
              value={repositoryLabels}
              multiple
            >
              {selectedRepository?.labels.map((label) => (
                <MenuItem key={label.name} value={label.name.toString()}>
                  <Chip size='small' label={label.name} />
                </MenuItem>
              ))}
            </Select>
          </FieldWrapper>
          <FieldWrapper label='CharmVerse Reward Author' required>
            <InputSearchMemberMultiple
              onChange={(id: string[]) => {
                setValue('rewardAuthorId', id[id.length - 1], formFieldOptions);
              }}
              disabled={disabled}
              disableClearable
              defaultValue={rewardRepo ? [rewardAuthorId] : undefined}
              disableCloseOnSelect
              filterSelectedOptions
            />
          </FieldWrapper>
          <FieldWrapper label='CharmVerse Reward Template'>
            <Select
              fullWidth
              disabled={disabled}
              displayEmpty
              onChange={(e) => {
                const value = e.target.value;
                setValue('rewardTemplateId', value === 'none' ? null : value, formFieldOptions);
              }}
              renderValue={(templateId) => {
                const template = templates?.find((tpl) => tpl.page.id === templateId);
                if (template) {
                  return <Typography>{template.page.title}</Typography>;
                }

                return <Typography color='secondary'>Select a reward template</Typography>;
              }}
              placeholder='Select a reward template'
              value={rewardTemplateId ?? 'none'}
            >
              {templates?.map((template) => (
                <MenuItem key={template.page.id} value={template.page.id}>
                  <Typography>{template.page.title}</Typography>
                </MenuItem>
              ))}
              <MenuItem value='none'>
                <Typography>No template</Typography>
              </MenuItem>
            </Select>
          </FieldWrapper>

          <Stack flexDirection='row' gap={2}>
            <Button
              variant='contained'
              color='primary'
              loading={isConnectingGithubRepository || isUpdatingGithubRepoWithReward}
              disabled={!formState.isValid || disabled || Object.keys(formState.dirtyFields).length === 0}
              disabledTooltip={!formState.isValid ? `Please select Github Repository and Reward Author` : undefined}
              onClick={handleConnectGithubRepository}
            >
              Save
            </Button>
            {!hideDisconnect && (
              <Button
                variant='outlined'
                color='error'
                loading={isDisconnectingGithubApplication}
                disabled={disabled}
                onClick={disconnectGithubModalState.open}
              >
                Disconnect
              </Button>
            )}
            <ConfirmDeleteModal
              title='Disconnect Github Application'
              onClose={disconnectGithubModalState.close}
              open={disconnectGithubModalState.isOpen}
              buttonText='Disconnect'
              question={`This will stop syncing ${getFeatureTitle('rewards')} with repository issues.`}
              onConfirm={handleDisconnect}
            />
          </Stack>
        </Stack>
      </Grid>
    </Grid>
  );
}
