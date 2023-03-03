import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Box from '@mui/system/Box';
import type { PostCategory } from '@prisma/client';
import { useEffect, useState } from 'react';

import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useSnackbar } from 'hooks/useSnackbar';

type Props = {
  category: PostCategory;
  onClose: () => void;
  onSave: (description: string) => void;
  open: boolean;
};

export function CategoryDescriptionDialog({ category, onClose, onSave, open }: Props) {
  const [tempDescription, setTempDescription] = useState(category.description || '');

  const { showMessage } = useSnackbar();

  useEffect(() => {
    setTempDescription(category.description || '');
  }, [category.description]);

  async function handleSave() {
    if (tempDescription !== category.description) {
      try {
        await onSave(tempDescription);
        onClose();
      } catch (err) {
        showMessage((err as any).message ?? 'An error occurred while saving the description', 'error');
      }
    }
  }

  return (
    <Modal title='Describe this category' open={open} onClose={onClose}>
      <Stack>
        <TextField
          value={tempDescription}
          onChange={(e) => setTempDescription(e.target.value)}
          autoFocus
          multiline
          minRows={5}
          fullWidth
        />
        <Box mt={2}>
          <Button onClick={handleSave}>Save</Button>
        </Box>
      </Stack>
    </Modal>
  );
}
