import { Box, Typography } from '@mui/material';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { DialogTitle, Modal } from 'components/common/Modal';
import CharmEditor from 'components/editor/CharmEditor';
import FieldLabel from 'components/settings/FieldLabel';
import { useUser } from 'hooks/useUser';

interface IToken {
  symbol: string;
  img: string;
}

/*
const CRYPTO_CURRENCY_LIST = Object.keys(CryptoCurrencyList) as CryptoCurrency[];

type ModalType = 'create' | 'edit' | 'suggest';

interface Props {
  open: boolean;
  modalType: ModalType;
  bounty?: Bounty;
  onClose: () => void;
  onSubmit: (bounty: Bounty) => void;
}

const modalTitles: Record<ModalType, string> = {
  suggest: 'Suggest a Bounty',
  create: 'Create a Bounty',
  edit: 'Edit a Bounty'
};

export const descSchema = yup.object({
  type: yup.string(),
  content: yup.array()
});

export const schema = yup.object({
  author: yup.string().required(),
  title: yup.string().ensure().trim().lowercase()
    .required('Title is required'),
  description: descSchema,
  type: yup.string().required().trim(),
  status: yup.mixed<BountyStatus>().oneOf([...BOUNTY_STATUSES]).required(),
  reviewer: yup.string().ensure().trim(),
  assignee: yup.string().ensure().trim(),
  rewardToken: yup.mixed<CryptoCurrency>().oneOf(CRYPTO_CURRENCY_LIST).required(),
  rewardAmount: yup.number().required()
});

export type FormValues = yup.InferType<typeof schema>;

export default function BountyModal (props: Props) {
  const { open, onClose, onSubmit: _onSubmit, modalType, bounty } = props;
  const [user] = useUser();

  return (
    <Modal size='large' open={open} onClose={onClose}>
      <DialogTitle onClose={onClose}>{modalTitles[modalType]}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <TextField
              {...register('title')}
              fullWidth
              error={!!errors.title}
              placeholder='Bounty title'
              helperText={errors.title?.message}
              variant='outlined'
            />
          </Grid>
          {modalType !== 'suggest' && (
            <Grid item>
              <Grid container direction='row' alignItems='center'>
                <Grid item xs={6}>
                  <Typography>Status</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Select
                    labelId='select-type'
                    id='select-type'
                    value={watchStatus}
                    variant='standard'
                    label='type'
                    onChange={handleStatusSelect}
                  >
                    <MenuItem value='pending'>
                      <Chip label='Not Started' color='primary' />
                    </MenuItem>
                    <MenuItem value='in-progress'>
                      <Chip label='In Progress' color='secondary' />
                    </MenuItem>
                    <MenuItem value='done'>
                      <Chip label='Done' color='secondary' />
                    </MenuItem>
                  </Select>
                </Grid>
              </Grid>
            </Grid>
          )}

          <Grid item>
            <CharmEditor />
          </Grid>

          <Grid item>
            <FieldLabel>Reward</FieldLabel>
            <Divider />
            <Box>
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Reviewer</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    {...register('reviewer')}
                    fullWidth
                    variant='outlined'
                    error={!!errors?.reviewer}
                  />
                </Grid>
              </Grid>
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Assignee</Typography>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    {...register('assignee')}
                    fullWidth
                    variant='outlined'
                    error={!!errors?.assignee}
                  />
                </Grid>
              </Grid>

    </Modal>
  );
}
*/
