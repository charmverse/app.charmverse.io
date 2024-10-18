import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { yupResolver } from '@hookform/resolvers/yup';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { IconButton, InputAdornment, Tooltip } from '@mui/material';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { DialogTitle } from 'components/common/Modal';
import Avatar from 'components/settings/space/components/LargeAvatar';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { generateNotionImportRedirectUrl } from 'lib/notion/generateNotionImportRedirectUrl';
import { spaceTemplateIds } from 'lib/spaces/config';
import type { SpaceTemplateType } from 'lib/spaces/config';
import { setCookie, getSpaceUrl } from 'lib/utils/browser';
import { randomName } from 'lib/utils/randomName';

import { ImportZippedMarkdown } from '../ImportZippedMarkdown';
import { SpaceAccessGateWithSearch } from '../SpaceAccessGate/SpaceAccessGateWithSearch';

import { spaceTemplateCookie } from './constants';
import { SelectNewSpaceTemplate } from './SelectNewSpaceTemplate';

const schema = yup.object({
  name: yup.string().ensure().trim().min(3, 'Name must be at least 3 characters').required('Name is required'),
  spaceImage: yup.string().nullable(),
  spaceTemplateOption: yup.mixed<SpaceTemplateType>().oneOf(spaceTemplateIds).default('default')
});
type FormValues = yup.InferType<typeof schema>;

interface Props {
  className?: string;
  defaultValues?: { name: string; domain: string };
  onCancel?: () => void;
  submitText?: string;
  setModalWidth?: (width: 'number') => void;
}

type SpaceFormStep = 'select_template' | 'create_space' | 'join_space';

export function CreateSpaceForm({ className, defaultValues, onCancel, submitText }: Props) {
  const { createNewSpace, isCreatingSpace } = useSpaces();
  const { showMessage } = useSnackbar();
  const [newSpace, setNewSpace] = useState<Space | null>(null);

  const [step, setStep] = useState<SpaceFormStep>('select_template');

  const router = useRouter();
  const [saveError, setSaveError] = useState<any | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: defaultValues || { name: randomName() },
    resolver: yupResolver(schema)
  });

  const watchName = watch('name');
  const watchSpaceImage = watch('spaceImage');
  const watchSpaceTemplate = watch('spaceTemplateOption');

  // This use effect should only be relevant when a user uploads markdown, has an error, and then changes the space name or image. In other cases, the space is created and the user is redirected to the space.
  useEffect(() => {
    if (newSpace) {
      charmClient.spaces.updateSpace({
        name: watchName,
        spaceImage: watchSpaceImage
      });
    }
  }, [watchName, watchSpaceImage]);

  const editableFields = !newSpace || (newSpace && watchSpaceTemplate === 'importMarkdown');
  const submitLabel = newSpace ? 'Redirecting...' : submitText || 'Create';

  function onClose() {
    setNewSpace(null);
    onCancel?.();
  }

  async function uploadMarkdownToNewSpace(file: File) {
    setSaveError(null);
    const spaceToUploadFiles =
      newSpace ??
      (await createNewSpace({
        spaceData: {
          name: watchName,
          spaceImage: watchSpaceImage
        },
        spaceTemplate: watchSpaceTemplate
      })
        .then((_space) => {
          setNewSpace(_space);
          return _space;
        })
        .catch((err) => {
          setSaveError(err);
        }));

    if (spaceToUploadFiles) {
      charmClient.file
        .uploadZippedMarkdown({
          file,
          spaceId: spaceToUploadFiles.id
        })
        .then((pages) => {
          showMessage(`Imported ${pages.length} pages to the ${spaceToUploadFiles.name} space`);
          setTimeout(() => {
            router.push(`/${spaceToUploadFiles.domain}`);
          }, 200);
        })
        .catch((err) => {
          setSaveError(err);
        });
    }
  }

  const onSubmit = useCallback(async (values: FormValues) => {
    try {
      setSaveError(null);
      const space = await createNewSpace({
        spaceTemplate: values.spaceTemplateOption as SpaceTemplateType,
        spaceData: {
          name: values.name,
          spaceImage: values.spaceImage
        }
      });

      setNewSpace(space);

      // record for onboarding
      setCookie({
        name: spaceTemplateCookie,
        value: values.spaceTemplateOption,
        expiresAfterSession: true
      });
      if ((values.spaceTemplateOption as SpaceTemplateType) === 'importNotion') {
        const notionUrl = generateNotionImportRedirectUrl({
          origin: window?.location.origin,
          spaceDomain: space.domain
        });

        router.push(notionUrl);
        // We want to make the user import markdown after creating the space
      } else if ((values.spaceTemplateOption as SpaceTemplateType) !== 'importMarkdown') {
        // Give time for spaces hook to update so user doesn't end up on Routeguard
        setTimeout(() => {
          router.push(getSpaceUrl({ domain: space.domain }));
        }, 200);
      }
    } catch (err) {
      log.error('Error creating space', err);
      setSaveError((err as Error).message || err);
    }
  }, []);

  const isBanned =
    (typeof saveError === 'string' && saveError.includes('blocked')) ||
    (saveError instanceof Error && saveError.message.includes('blocked'));

  function randomizeName() {
    const name = randomName();
    setValue('name', name);
  }

  function handleNewSpaceTemplate(value: SpaceTemplateType) {
    setValue('spaceTemplateOption', value);
    setStep('create_space');
  }

  function goToSelectTemplate() {
    setStep('select_template');
  }

  const errorText = typeof saveError === 'string' ? saveError : (saveError?.message ?? 'Error creating space');

  if (step === 'join_space') {
    return (
      <Box>
        <SpaceAccessGateWithSearch goBack={goToSelectTemplate} />
      </Box>
    );
  }
  return (
    <div className={className}>
      <DialogTitle onClose={onCancel ? onClose : undefined} sx={{ textAlign: 'center' }}>
        <Box display='flex' alignItems='center' gap={1}>
          {step !== 'select_template' && (
            <IconButton onClick={goToSelectTemplate} size='small'>
              <ArrowBackIosNewIcon />
            </IconButton>
          )}
          Create a space{' '}
        </Box>
      </DialogTitle>

      {step === 'select_template' && (
        <>
          <SelectNewSpaceTemplate onSelect={handleNewSpaceTemplate} />

          <Divider sx={{ my: 2 }} />
          <Typography sx={{ mb: 2 }} textAlign='center' fontWeight='bold'>
            Join an existing space
          </Typography>
          <Button color='secondary' size='large' disableElevation fullWidth onClick={() => setStep('join_space')}>
            Search for space
          </Button>
        </>
      )}

      {step === 'create_space' && (
        <form data-test='create-space-form' onSubmit={handleSubmit(onSubmit)}>
          <Grid container direction='column' spacing={2}>
            <Grid item display='flex' justifyContent='center'>
              <Avatar
                name={watchName}
                variant='rounded'
                image={watchSpaceImage}
                updateImage={(url) => setValue('spaceImage', url, { shouldDirty: true })}
                editable={editableFields}
                alwaysShowEdit={editableFields}
              />
            </Grid>
            <Grid item>
              <FieldLabel>Name</FieldLabel>
              <TextField
                data-test='workspace-name-input'
                {...register('name')}
                disabled={!editableFields}
                autoFocus
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
                InputProps={
                  defaultValues
                    ? {}
                    : {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <Tooltip arrow placement='top' title='Regenerate random name'>
                              <IconButton size='small' onClick={randomizeName}>
                                <RefreshIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        )
                      }
                }
              />
            </Grid>
            <Grid item sx={{ display: 'flex', justifyContent: 'center' }}>
              {watchSpaceTemplate !== 'importMarkdown' && (
                <Button
                  size='large'
                  disabled={!watchName || !!newSpace || isBanned}
                  type='submit'
                  data-test='create-workspace'
                  loading={isCreatingSpace}
                  sx={{ px: 4 }}
                >
                  {submitLabel}
                </Button>
              )}
              {watchSpaceTemplate === 'importMarkdown' && (
                <ImportZippedMarkdown
                  size='large'
                  variant='contained'
                  disableElevation
                  onFile={uploadMarkdownToNewSpace}
                />
              )}
            </Grid>
            {saveError && (
              <Grid item>
                <Alert severity='error'>{errorText}</Alert>
              </Grid>
            )}
          </Grid>
        </form>
      )}
    </div>
  );
}

export const StyledCreateSpaceForm = styled(CreateSpaceForm)`
  // add styling so that the container takes full height of screen
  ${({ theme }) => theme.breakpoints.down('md')} {
    .space-templates-container {
      max-height: calc(100vh - 250px);
      padding: 0;
      margin: 0;
    }
  }
`;
