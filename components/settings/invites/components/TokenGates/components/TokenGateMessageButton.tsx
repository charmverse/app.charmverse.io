import { Edit as EditIcon } from '@mui/icons-material';
import { Box } from '@mui/material';
import { usePopupState, bindPopper, bindTrigger } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { InlineCharmEditor } from 'components/common/CharmEditor';
import Modal from 'components/common/Modal';

export function TokenGateMessageButton({ message }: { message?: any | null }) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'evaluation-step-settings-modal' });
  const [value, setValue] = useState(message);

  function saveMessage() {
    popupState.close();
  }
  return (
    <>
      <Button
        variant='text'
        color='secondary'
        {...bindTrigger(popupState)}
        startIcon={<EditIcon fontSize='small' />}
        size='small'
      >
        Include a message
      </Button>
      <Modal {...bindPopper(popupState)} size='500px' title='Include a message'>
        <Box mb={2}>
          <InlineCharmEditor
            content={value}
            placeholderText='Include a message on the Token Gate...'
            onContentChange={(v) => {
              setValue(v);
            }}
          />
        </Box>
        <Box display='flex' justifyContent='flex-end' gap={1}>
          <Button color='secondary' variant='outlined' onClick={popupState.close}>
            Cancel
          </Button>
          <Button onClick={saveMessage}>Save</Button>
        </Box>
      </Modal>
    </>
  );
}
