import { Edit as EditIcon } from '@mui/icons-material';
import { Box } from '@mui/material';
import { usePopupState, bindPopper, bindTrigger } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { useUpdateSpace } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import { InlineCharmEditor } from 'components/common/CharmEditor';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

export function TokenGateMessageButton({ message, spaceId }: { message?: any | null; spaceId?: string }) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'evaluation-step-settings-modal' });
  const [value, setValue] = useState(message);
  const { trigger } = useUpdateSpace(spaceId);
  const { showError } = useSnackbar();
  const { refreshCurrentSpace } = useCurrentSpace();

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
      <Modal {...bindPopper(popupState)} size='500px' title='Include a message'>
        <Box mb={2}>
          <InlineCharmEditor
            content={value}
            placeholderText='Include a message on the Token Gate...'
            onContentChange={({ doc }) => {
              setValue(doc);
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
