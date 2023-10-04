import { Stack, Typography, Box, Card, Menu, Paper } from '@mui/material';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { CustomEmojiPicker } from 'components/common/CustomEmojiPicker';
import { Dialog as DialogComponent } from 'components/common/Dialog/Dialog';
import { TextInputField } from 'components/common/form/fields/TextInputField';

export default {
  title: 'common/Dialog',
  component: DialogComponent
};

export function Standard() {
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const [open4, setOpen4] = useState(false);

  return (
    <Paper sx={{ p: 4 }}>
      <Stack gap={4}>
        <Stack alignItems='flex-start'>
          <Typography variant='h6'>Dialog with title</Typography>
          <Button onClick={() => setOpen1(true)}>Open</Button>
          <DialogComponent open={open1} onClose={() => setOpen1(false)} title='Dialog title'>
            Example content
          </DialogComponent>
        </Stack>

        <Stack alignItems='flex-start'>
          <Typography variant='h6'>Dialog with title and action buttons</Typography>
          <Button onClick={() => setOpen2(true)}>Open</Button>
          <DialogComponent
            open={open2}
            onClose={() => setOpen2(false)}
            title='Dialog title'
            footerActions={
              <>
                <Button>action 1</Button>
                <Button>action 2</Button>
              </>
            }
          >
            Example content
          </DialogComponent>
        </Stack>

        <Stack alignItems='flex-start'>
          <Typography variant='h6'>Dialog with custom title component</Typography>
          <Button onClick={() => setOpen3(true)}>Open</Button>
          <DialogComponent
            open={open3}
            onClose={() => setOpen3(false)}
            title={
              <Typography variant='h3' color='primary'>
                Custom title component
              </Typography>
            }
            footerActions={
              <>
                <Button>action 1</Button>
                <Button>action 2</Button>
              </>
            }
          >
            <Stack flex={1} gap={4}>
              Example content
              <TextInputField label='TextInputField' value='example content' onChange={() => {}} />
              <TextInputField label='TextInputField' value='example content' onChange={() => {}} />
            </Stack>
          </DialogComponent>
        </Stack>

        <Stack alignItems='flex-start'>
          <Typography variant='h6'>Scrollable dialog with long content</Typography>
          <Button onClick={() => setOpen4(true)}>Open</Button>
          <DialogComponent
            open={open4}
            onClose={() => setOpen4(false)}
            title='Dialog title'
            footerActions={
              <>
                <Button>action 1</Button>
                <Button>action 2</Button>
              </>
            }
          >
            <Stack flex={1} gap={4}>
              <TextInputField label='TextInputField' value='example content' onChange={() => {}} />
              <TextInputField label='TextInputField' value='example content' onChange={() => {}} />
              <TextInputField label='TextInputField' value='example content' onChange={() => {}} />
              <TextInputField label='TextInputField' value='example content' onChange={() => {}} />
              <TextInputField label='TextInputField' value='example content' onChange={() => {}} />
              <TextInputField label='TextInputField' value='example content' onChange={() => {}} />
              <TextInputField label='TextInputField' value='example content' onChange={() => {}} />
              <TextInputField label='TextInputField' value='example content' onChange={() => {}} />
              <TextInputField label='TextInputField' value='example content' onChange={() => {}} />
              <TextInputField label='TextInputField' value='example content' onChange={() => {}} />
              <TextInputField label='TextInputField' value='example content' onChange={() => {}} />
              <TextInputField label='TextInputField' value='example content' onChange={() => {}} />
            </Stack>
          </DialogComponent>
        </Stack>
      </Stack>
    </Paper>
  );
}

export function EmojiPicker() {
  const popupState = usePopupState({ variant: 'popover', popupId: `emoji-picker` });

  return (
    <Paper sx={{ p: 4 }}>
      <Box display='flex' flexDirection='column' gap={4}>
        <Stack alignItems='flex-start' gap={2}>
          <Typography variant='h6'>Popup example:</Typography>
          <Button {...bindTrigger(popupState)}>Show popup</Button>
        </Stack>
        <Menu
          {...bindMenu(popupState)}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <CustomEmojiPicker onUpdate={() => {}} />
        </Menu>
        <Typography variant='h6'>Popup content:</Typography>
        <Card variant='outlined' sx={{ maxWidth: 350 }}>
          <CustomEmojiPicker onUpdate={() => {}} />
        </Card>
      </Box>
    </Paper>
  );
}
