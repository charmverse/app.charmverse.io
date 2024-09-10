'use client';

import { log } from '@charmverse/core/log';
import { FormErrors } from '@connect-shared/components/common/FormErrors';
import { yupResolver } from '@hookform/resolvers/yup';
import AddIcon from '@mui/icons-material/Add';
import { Box, Stack, Button, Divider, MenuItem, Select, Typography, ListItemIcon } from '@mui/material';
import type { FarcasterUser } from '@root/lib/farcaster/getFarcasterUsers';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { postCreateCastMessage } from 'lib/postCreateCastMessage';
import { getCastMessage } from 'lib/productUpdates/castMessage';
import { createProductUpdateAction } from 'lib/productUpdates/createProductUpdateAction';
import { schema, type FormValues } from 'lib/productUpdates/schema';
import { DIVIDER } from 'lib/productUpdates/schema';
import type { ConnectProjectMinimal } from 'lib/projects/getConnectProjectsByFid';

import { CharmTextField } from './CharmTextField';
import { ProjectAvatar } from './ProjectAvatar';

type JSONContent = {
  type: 'doc';
  content: [
    {
      type: 'bullet_list';
      content: {
        type: 'list_item';
        content: {
          type: 'paragraph';
          content?: {
            type: 'text' | 'hardBreak';
            text?: string;
          }[];
        }[];
      }[];
    }
  ];
};

export function NewProductUpdateForm({
  connectProjects,
  farcasterUser,
  onClickCreateProject,
  projectId
}: {
  farcasterUser: FarcasterUser;
  connectProjects: ConnectProjectMinimal[];
  onClickCreateProject: VoidFunction;
  projectId: string;
}) {
  const [errors, setErrors] = useState<string[] | null>(null);
  const [editorKey, setEditorKey] = useState(1); // keep track of state to clear editor
  const { control, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      authorFid: farcasterUser.fid,
      projectId,
      createdAtLocal: new Date().toLocaleDateString()
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  useEffect(() => {
    setValue('projectId', projectId);
  }, [projectId]);

  // kinda hacky, find a more elegant way to clear the editor?
  function clearEditor() {
    setEditorKey((key) => key + 1);
  }

  const { execute, isExecuting } = useAction(createProductUpdateAction, {
    onExecute: () => {
      setErrors(null);
    },
    onSuccess: (data) => {
      reset();
      clearEditor();
      if (data.data) {
        const castMessage = getCastMessage(data.data);

        postCreateCastMessage({
          embeds: [`https://${window.location.hostname}/product-updates/frames/${data.data.productUpdatesFrame.id}`],
          text: getCastMessage(data.data)
        });
      }
    },
    onError: (err) => {
      log.error('Error submitting form', { error: err });
      setErrors(['An error occurred. Please try again.']);
    }
  });

  const createdAtLocal = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      // weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  if (connectProjects.length === 0) {
    return (
      <div>
        <Button onClick={onClickCreateProject} size='large'>
          Create a project to get started
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((data) => {
        const json = data.content.json as JSONContent;
        // TODO: figure out why data.content is not a plain object
        const jsonPOJO = JSON.parse(JSON.stringify(json));

        // We can't render prosemirror JSON for the image, so we need to convert it to text
        const lines = json.content[0].content.slice(0, 10).map((content) => content.content[0].content);
        const text = lines
          .map((content) => `${content?.map((c) => (c.type === 'hardBreak' ? '\n' : `${c.text}`)).join('') || '\n'}`)
          // use a separator that is unlikely to be in the text
          .join(DIVIDER);

        execute({
          ...data,
          content: {
            json: jsonPOJO,
            text
          },
          createdAtLocal
        });
      })}
    >
      <Typography variant='h5' gutterBottom>
        Product Update for {createdAtLocal}
      </Typography>
      <Stack gap={2}>
        <Stack direction='row' gap={2} alignItems='center' flexWrap='wrap'>
          <Typography>Project</Typography>
          <Controller
            control={control}
            name='projectId'
            render={({ field, fieldState }) => (
              <Select
                displayEmpty
                disabled={isExecuting}
                renderValue={(value) => {
                  const project = connectProjects.find((p) => p.id === value);
                  if (project) {
                    return (
                      <Stack direction='row'>
                        <ListItemIcon>
                          <ProjectAvatar src={project.avatar} />
                        </ListItemIcon>
                        {project.name}
                      </Stack>
                    );
                  }
                  return <Typography color='secondary'>Select a project</Typography>;
                }}
                error={!!fieldState.error}
                sx={{ flexGrow: 1, maxWidth: '100%' }}
                {...field}
              >
                {connectProjects.map((connectProject) => (
                  <MenuItem key={connectProject.id} value={connectProject.id}>
                    <ListItemIcon>
                      <ProjectAvatar src={connectProject.avatar} />
                    </ListItemIcon>
                    {connectProject.name}
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem key='create-project' onClick={onClickCreateProject}>
                  <AddIcon sx={{ mr: 0.5 }} fontSize='small' />
                  Create project
                </MenuItem>
              </Select>
            )}
          />
        </Stack>
        <Stack>
          <Controller
            control={control}
            name='content'
            render={({ field, fieldState }) => (
              <CharmTextField
                extensionGroup='product_updates'
                key={editorKey}
                placeholder='1. Updated documentation ...'
                helperText='Provide a list of your product updates on each line. Empty lines will be ignored.'
                error={!!fieldState.error}
                rows={7}
                {...field}
              />
            )}
          />
        </Stack>

        <Stack direction='row'>
          <Box flexGrow={1}>
            <FormErrors errors={errors} />
          </Box>
          <Button
            type='submit'
            size='large'
            sx={{
              width: 'fit-content'
            }}
            variant='contained'
            disabled={isExecuting}
          >
            Publish
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
