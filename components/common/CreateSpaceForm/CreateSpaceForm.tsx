import { yupResolver } from '@hookform/resolvers/yup';
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft';
import RefreshIcon from '@mui/icons-material/Refresh';
import { IconButton, InputAdornment, Tooltip, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import type { Space } from '@prisma/client';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import FieldLabel from 'components/common/form/FieldLabel';
import { DialogTitle } from 'components/common/Modal';
import PrimaryButton from 'components/common/PrimaryButton';
import Avatar from 'components/settings/workspace/LargeAvatar';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import log from 'lib/log';
import { generateNotionImportRedirectUrl } from 'lib/notion/generateNotionImportRedirectUrl';
import type { SpaceCreateTemplate } from 'lib/spaces/utils';
import { getSpaceDomainFromName } from 'lib/spaces/utils';
import { domainSchema } from 'lib/spaces/validateDomainName';
import randomName from 'lib/utilities/randomName';

import { ImportZippedMarkdown } from '../CharmEditor/components/markdownParser/ImportZippedMarkdown';

import { SelectNewSpaceTemplate } from './SpaceTemplateOptions';

const defaultTemplate: SpaceCreateTemplate = 'default';

export const schema = yup.object({
  id: yup.string(),
  domain: domainSchema.test('domain-exists', 'Domain already exists', async function checkDomain(domain) {
    const { ok } = await charmClient.checkDomain({ domain, spaceId: this.parent.id });
    return !ok;
  }),
  name: yup.string().ensure().trim().min(3, 'Name must be at least 3 characters').required('Name is required'),
  spaceImage: yup.string().nullable(true),
  spaceTemplateOption: yup.string().default(defaultTemplate)
});

export type FormValues = yup.InferType<typeof schema>;

interface Props {
  defaultValues?: { name: string; domain: string };
  onCancel?: () => void;
  submitText?: string;
}

export function CreateSpaceForm({ defaultValues, onCancel, submitText }: Props) {
  const { user } = useUser();
  const { createNewSpace, isCreatingSpace } = useSpaces();
  const { showMessage } = useSnackbar();

  const [newSpace, setNewSpace] = useState<Space | null>(null);

  const [step, setStep] = useState<1 | 2>(1);

  const router = useRouter();

  const [saveError, setSaveError] = useState<any | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, touchedFields }
  } = useForm<FormValues>({
    defaultValues: defaultValues || getDefaultName(),
    resolver: yupResolver(schema)
  });

  const watchName = watch('name');
  const watchDomain = watch('domain');
  const watchSpaceImage = watch('spaceImage');
  const watchSpaceTemplate = watch('spaceTemplateOption');

  function uploadMarkdownToNewSpace(file: File) {
    if (newSpace) {
      charmClient.file
        .uploadZippedMarkdown({
          file,
          spaceId: newSpace.id
        })
        .then((pages) => {
          showMessage(`Imported ${pages.length} pages to the ${newSpace.name} space`);
          router.push(`/${newSpace.domain}`);
        });
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      setSaveError(null);
      const space = await createNewSpace({
        createSpaceOption: values.spaceTemplateOption as SpaceCreateTemplate,
        spaceData: {
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: user!.id,
          spaceRoles: {
            create: [
              {
                isAdmin: true,
                user: {
                  connect: {
                    id: user!.id
                  }
                }
              }
            ]
          },
          id: values.id,
          domain: values.domain,
          name: values.name,
          spaceImage: values.spaceImage
        }
      });

      setNewSpace(space);

      if ((values.spaceTemplateOption as SpaceCreateTemplate) === 'importNotion') {
        const notionUrl = generateNotionImportRedirectUrl({
          origin: router.asPath.split('/')?.[0],
          spaceDomain: space.domain
        });

        router.push(notionUrl);
        // We want to make the user import markdown after creating the space
      } else if ((values.spaceTemplateOption as SpaceCreateTemplate) !== 'importMarkdown') {
        // Give time for spaces hook to update so user doesn't end up on Routeguard
        setTimeout(() => {
          router.push(`/${space.domain}`);
        }, 200);
      }
    } catch (err) {
      log.error('Error creating space', err);
      setSaveError((err as Error).message || err);
    }
  }

  function onChangeName(event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.value;
    if (!touchedFields.domain) {
      setValue('domain', getSpaceDomainFromName(name));
    }
  }

  function randomizeName() {
    const { name, domain } = getDefaultName();
    setValue('name', name);
    setValue('domain', domain);
  }

  function handleNewSpaceTemplate(value: SpaceCreateTemplate) {
    setValue('spaceTemplateOption', value);
    setStep(2);
  }

  return (
    <div>
      <DialogTitle onClose={onCancel}>Create a space</DialogTitle>
      {step === 1 ? (
        <SelectNewSpaceTemplate
          selectedTemplate={watchSpaceTemplate as SpaceCreateTemplate}
          onSelect={handleNewSpaceTemplate}
        />
      ) : (
        <form data-test='create-space-form' onSubmit={handleSubmit(onSubmit)}>
          <Divider />
          <Typography>
            <ArrowCircleLeftIcon onClick={() => setStep(1)} /> Selected template: {watchSpaceTemplate}
          </Typography>
          <br />
          <Grid container direction='column' spacing={2}>
            <Grid item display='flex' justifyContent='center'>
              <Avatar
                name={watchName}
                variant='rounded'
                image={watchSpaceImage}
                updateImage={(url) => setValue('spaceImage', url, { shouldDirty: true })}
                editable={true}
              />
            </Grid>
            <Grid item>
              <FieldLabel>Name</FieldLabel>
              <TextField
                data-test='workspace-name-input'
                {...register('name', {
                  onChange: onChangeName
                })}
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
            <Grid item>
              <FieldLabel>Domain</FieldLabel>
              <TextField
                {...register('domain')}
                fullWidth
                error={!!errors.domain}
                helperText={errors.domain?.message}
                inputProps={{
                  'data-test': 'workspace-domain-input'
                }}
              />
            </Grid>
            <Grid item sx={{ display: 'flex', justifyContent: 'center' }}>
              {(!newSpace || watchSpaceTemplate !== 'importMarkdown') && (
                <PrimaryButton
                  disabled={!watchName || !watchDomain || !!newSpace}
                  type='submit'
                  data-test='create-workspace'
                  loading={isCreatingSpace}
                >
                  {submitText || 'Create Space'}
                </PrimaryButton>
              )}
              {newSpace && watchSpaceTemplate === 'importMarkdown' && (
                <ImportZippedMarkdown onFile={uploadMarkdownToNewSpace} />
              )}
            </Grid>
            {saveError && (
              <Grid item>
                <Alert severity='error'>{saveError}</Alert>
              </Grid>
            )}
          </Grid>
        </form>
      )}
    </div>
  );
}

function getDefaultName(): { name: string; domain: string } {
  const name = randomName();
  return {
    name,
    domain: name
  };
}
