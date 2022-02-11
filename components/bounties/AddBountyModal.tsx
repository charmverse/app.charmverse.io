import { Modal, DialogTitle } from 'components/common/Modal';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import PrimaryButton from 'components/common/PrimaryButton';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';

import * as yup from 'yup';
import { Box } from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: any) => void;
}
export const rewardSchema = yup.object({
  reviewer: yup.string().ensure().trim(),
  assignee: yup.string().ensure().trim(),
  token: yup.string().ensure().trim(),
  amount: yup.number()
});

export const schema = yup.object({
  title: yup.string().ensure().trim().lowercase()
    .required('Title is required'),
  description: yup.string().ensure().trim(),
  type: yup.string().ensure().trim(),
  status: yup.string().ensure().trim(),
  reward: rewardSchema
});

export type FormValues = yup.InferType<typeof schema>;

export default function AddBountyModal (props: Props) {
  const { open, onClose, onSubmit } = props;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, touchedFields }
  } = useForm<FormValues>({
    defaultValues: {
      title: 'New bounty',
      description: 'Description',
      type: 'social',
      status: 'pending',
      reward: {
        reviewer: 'me'
      }
    },
    resolver: yupResolver(schema)
  });
  const handleTypeSelect = (e: SelectChangeEvent) => {
    setValue('type', e.target.value as string);
  };

  const watchType = watch('type');

  return (
    <Modal open={true} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle onClose={onClose}>Adding new bounty</DialogTitle>
        <Divider />
        <br />
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <TextField
              {...register('title')}
              fullWidth
              error={!!errors.title}
              helperText={errors.title?.message}
            />
          </Grid>
          <Grid item>
            <Select
              labelId='select-type'
              id='select-type'
              value={watchType}
              label='type'
              onChange={handleTypeSelect}
            >
              <MenuItem value='social'>
                <Chip label='SOCIAL' color='primary' />
              </MenuItem>
              <MenuItem value='content'>
                <Chip label='CONTENT' color='secondary' />
              </MenuItem>
            </Select>
          </Grid>
          <Grid item>
            <Box>
              <TextField
                {...register('reward.reviewer')}
                fullWidth
                error={!!errors.reward?.reviewer}
                helperText={errors.reward?.reviewer?.message}
              />
            </Box>
          </Grid>
          <Grid item>
            <PrimaryButton type='submit'>Add Bounty</PrimaryButton>
          </Grid>
        </Grid>
      </form>
    </Modal>
  );
}
