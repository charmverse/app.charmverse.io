import { Modal, DialogTitle } from 'components/common/Modal';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import PrimaryButton from 'components/common/PrimaryButton';
import * as yup from 'yup';

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
  return (
    <Modal open={open} onClose={onClose}>
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
            <TextField
              {...register('type')}
              fullWidth
              error={!!errors.type}
              helperText={errors.type?.message}
            />
          </Grid>
          <Grid item>
            <TextField
              {...register('reward.reviewer')}
              fullWidth
              error={!!errors.reward?.reviewer}
              helperText={errors.reward?.reviewer?.message}
            />
          </Grid>
          <Grid item>
            <PrimaryButton type='submit'>Add Bounty</PrimaryButton>
          </Grid>
        </Grid>
      </form>
    </Modal>
  );
}
