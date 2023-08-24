import { Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { Dialog as DialogComponent } from 'components/common/Dialog/Dialog';
import { TextInputField } from 'components/common/form/fields/TextInputField';

export default {
  title: 'common/Dialog',
  component: DialogComponent
};

export function Dialog() {
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const [open4, setOpen4] = useState(false);

  return (
    <Stack gap={4}>
      <Stack alignItems='flex-start'>
        <Typography variant='subtitle1'>Dialog with title</Typography>
        <Button onClick={() => setOpen1(true)}>Open</Button>
        <DialogComponent open={open1} onClose={() => setOpen1(false)} title='Dialog title'>
          Example content
        </DialogComponent>
      </Stack>

      <Stack alignItems='flex-start'>
        <Typography variant='subtitle1'>Dialog with title and action buttons</Typography>
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
        <Typography variant='subtitle1'>Dialog with custom title component</Typography>
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
        <Typography variant='subtitle1'>Scrollable dialog with long content</Typography>
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
  );
}
