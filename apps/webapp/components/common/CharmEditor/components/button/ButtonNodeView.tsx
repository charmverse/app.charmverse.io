import { styled } from '@mui/material';
import { Box, Grid, Select, InputLabel, MenuItem, TextField } from '@mui/material';
import * as http from '@packages/adapters/http';
import type { NodeAttrs } from '@packages/bangleeditor/components/button/button.specs';
import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { RiNftLine } from 'react-icons/ri';

import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';

import BlockAligner from '../BlockAligner';
import { MediaSelectionPopupNoButton } from '../common/MediaSelectionPopup';
import { EmbedIcon } from '../iframe/components/EmbedIcon';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

export function ButtonNodeView({
  deleteNode,
  readOnly,
  node,
  selected,
  updateAttrs,
  view,
  getPos
}: CharmNodeViewProps) {
  const attrs = node.attrs as NodeAttrs;
  const autoOpen = node.marks.some((mark) => mark.type.name === 'tooltip-marker');
  const [showEditPopup, setShowEditPopup] = useState(false);

  function submitForm(values: NodeAttrs) {
    updateAttrs(values);
    setShowEditPopup(false);
  }

  function openPopup() {
    setShowEditPopup(true);
  }

  function closePopup() {
    setShowEditPopup(false);
  }

  useEffect(() => {
    if (autoOpen) {
      openPopup();
    }
  }, [autoOpen]);

  const popup = useMemo(
    () => (
      <MediaSelectionPopupNoButton
        open={showEditPopup}
        icon={<EmbedIcon icon={RiNftLine} size='large' />}
        buttonText='Embed a button'
        isSelected={selected}
        onDelete={deleteNode}
        onClose={closePopup}
        width={{}}
      >
        <ButtonForm defaultValues={node.attrs as NodeAttrs} onSubmit={submitForm} />
      </MediaSelectionPopupNoButton>
    ),
    [node, showEditPopup, selected]
  );

  return (
    <BlockAligner readOnly={readOnly} onEdit={openPopup} onDelete={deleteNode}>
      <ButtonView {...attrs} />
      {popup}
    </BlockAligner>
  );
}

function ButtonView(props: NodeAttrs) {
  const { showMessage, showError } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  async function callApi() {
    try {
      setIsLoading(true);
      await http[props.method](props.url, props.body ? JSON.parse(props.body) : undefined);
      if (props.successMessage) {
        showMessage(props.successMessage);
      }
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  }

  const alignSelf = props.align === 'center' ? 'center' : props.align === 'left' ? 'start' : 'end';

  return (
    <Box display='flex' flexDirection='column'>
      <Button disabled={!props.url} loading={isLoading} size={props.size} onClick={callApi} sx={{ alignSelf }}>
        {props.label}
      </Button>
    </Box>
  );
}

function ButtonForm({ defaultValues, onSubmit }: { defaultValues: NodeAttrs; onSubmit: (values: NodeAttrs) => void }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<NodeAttrs>({
    defaultValues,
    mode: 'onChange'
  });

  const requestMethod = watch('method');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box maxWidth='100%' width={500} p={2} display='flex' flexDirection='column' gap={1}>
        <div>
          <InputLabel>Action URL</InputLabel>
          <TextField
            fullWidth
            error={!!errors.url}
            {...register('url', { required: true, validate: { matchPattern: (v) => /^http/.test(v) } })}
            placeholder='https://api.com/endpoint'
          />
        </div>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <InputLabel>Request method</InputLabel>
          <Select<NodeAttrs['method']>
            sx={{ width: '50%' }}
            defaultValue={defaultValues.method}
            {...register('method', { required: true })}
          >
            <MenuItem value='GET'>GET</MenuItem>
            <MenuItem value='POST'>POST</MenuItem>
          </Select>
        </Box>
        {requestMethod === 'POST' && (
          <Grid container>
            <Grid item xs sx={{ display: 'flex', alignItems: 'center' }}>
              <InputLabel>Request Body (optional)</InputLabel>
            </Grid>
            <Grid item xs>
              <TextField
                fullWidth
                error={!!errors.body}
                {...register('body', {
                  validate: (value) => {
                    if (!value) return true;
                    try {
                      JSON.parse(value);
                      return true;
                    } catch (e) {
                      return false;
                    }
                  }
                })}
                placeholder='{ "hello": "world" }'
              />
            </Grid>
          </Grid>
        )}
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <InputLabel>Alignment</InputLabel>
          <Select<NodeAttrs['align']>
            sx={{ width: '50%' }}
            defaultValue={defaultValues.align}
            {...register('align', { required: true })}
          >
            <MenuItem value='left'>Left</MenuItem>
            <MenuItem value='center'>Center</MenuItem>
            <MenuItem value='right'>Right</MenuItem>
          </Select>
        </Box>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <InputLabel>Button size</InputLabel>
          <Select<NodeAttrs['size']>
            sx={{ width: '50%' }}
            defaultValue={defaultValues.size}
            {...register('size', { required: true })}
          >
            <MenuItem value='small'>Small</MenuItem>
            <MenuItem value='medium'>Medium</MenuItem>
            <MenuItem value='large'>Large</MenuItem>
          </Select>
        </Box>
        <Grid container>
          <Grid item xs sx={{ display: 'flex', alignItems: 'center' }}>
            <InputLabel>Button label</InputLabel>
          </Grid>
          <Grid item xs>
            <TextField {...register('label', { required: true })} placeholder='Submit' />
          </Grid>
        </Grid>
        <Grid container>
          <Grid item xs sx={{ display: 'flex', alignItems: 'center' }}>
            <InputLabel>Success message (optional)</InputLabel>
          </Grid>
          <Grid item xs>
            <TextField {...register('successMessage')} placeholder='Success!' />
          </Grid>
        </Grid>
        <Button disabled={!isValid} fullWidth type='submit'>
          Save
        </Button>
      </Box>
    </form>
  );
}
