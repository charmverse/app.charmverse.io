import { Edit as EditIcon } from '@mui/icons-material';
import { Box } from '@mui/material';
import { Editor } from '@packages/charmeditor/ui';
import { usePopupState, bindPopover, bindTrigger } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { useUpdateSpace } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

export function TokenGateMessageButton() {
  const { space, refreshCurrentSpace } = useCurrentSpace();
  const { trigger, isMutating } = useUpdateSpace(space?.id);
  const { showError } = useSnackbar();
  const [value, setValue] = useState(space?.tokenGateMessage);
  const popupState = usePopupState({ variant: 'popover', popupId: 'evaluation-step-settings-modal' });

  async function saveMessage() {
    try {
      await trigger({ tokenGateMessage: value });
      popupState.close();
      refreshCurrentSpace();
    } catch (error) {
      showError(error);
    }
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
      <Modal {...bindPopover(popupState)} size='500px' title='Include a message on the Token Gate'>
        <Box mb={2}>
          <Editor
            defaultValue={value as object}
            placeholder='Include a message on the Token Gate...'
            rows={3}
            onChange={({ json }) => {
              setValue(json);
            }}
          />
        </Box>
        <Box display='flex' justifyContent='flex-end' gap={1}>
          <Button color='secondary' variant='outlined' onClick={popupState.close}>
            Cancel
          </Button>
          <Button onClick={saveMessage} isLoading={isMutating}>
            Save
          </Button>
        </Box>
      </Modal>
    </>
  );
}
