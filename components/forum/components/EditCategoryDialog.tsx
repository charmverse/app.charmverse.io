import { yupResolver } from '@hookform/resolvers/yup';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Box from '@mui/system/Box';
import type { PostCategory } from '@prisma/client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useSnackbar } from 'hooks/useSnackbar';

type Props = {
  category: PostCategory;
  onClose: () => void;
  onSave: (data: Pick<PostCategory, 'name' | 'description'>) => void;
  open: boolean;
};

export const schema = yup.object({
  name: yup.string().required('Category name is required'),
  description: yup.string()
});

type FormValues = yup.InferType<typeof schema>;

export function EditCategoryDialog({ category, onClose, onSave, open }: Props) {
  const { showMessage } = useSnackbar();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      // Default to saved message in local storage
      name: category.name,
      description: category.description ?? ''
    },
    resolver: yupResolver(schema)
  });

  const values = watch();

  const valuesChanged = values.name !== category.name || values.description !== category.description;

  async function handleSave(updatedValues: FormValues) {
    if (valuesChanged) {
      try {
        await onSave({ name: updatedValues.name, description: updatedValues.description ?? '' });
        onClose();
      } catch (err) {
        showMessage((err as any).message ?? 'An error occurred while saving the description', 'error');
      }
    }
  }

  return (
    <Modal title='Edit category information' open={open} onClose={onClose}>
      <Stack>
        <InputLabel>Title</InputLabel>
        <TextField {...register('name')} data-test='category-description-name' autoFocus fullWidth />
        <Box mt={2} />
        <InputLabel>Description</InputLabel>
        <TextField
          {...register('description')}
          data-test='category-description-input'
          autoFocus
          multiline
          minRows={5}
          fullWidth
        />
        <Box mt={2}>
          <Button disabled={!valuesChanged} data-test='save-category-description' onClick={handleSubmit(handleSave)}>
            Save
          </Button>
        </Box>
      </Stack>
    </Modal>
  );
}
